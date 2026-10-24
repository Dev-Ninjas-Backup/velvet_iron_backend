import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import {
  CreateMedicationScheduleDto,
  UpdateMedicationScheduleDto,
} from './dto/create-medication-schedule.dto';
import {
  MedicationScheduleResponseDto,
  MedicationScheduleHistoryWithStatsDto,
  TodaySchedulesDto,
} from './dto/medication-schedule-response.dto';
import { LeveladdService } from '@/leveladd/leveladd.service';
import { getUserDayBoundaries } from '../common/utils/timezone.util';
import { getIsoWeekday } from '../common/utils/weekday.util';
import { ScheduleCompletionService } from '../schedule-completion/schedule-completion.service';

@Injectable()
export class MedicationScheduleService {
  constructor(
    private prisma: PrismaService,
    private readonly leveladd: LeveladdService,
    private readonly scheduleCompletionService: ScheduleCompletionService,
  ) {}

  async createMedicationSchedule(
    userId: string,
    dto: CreateMedicationScheduleDto,
  ): Promise<MedicationScheduleResponseDto> {
    const scheduledDate = new Date(dto.scheduleTime);
    const fallbackDay = scheduledDate.getDay() === 0 ? 7 : scheduledDate.getDay();
    const daysOfWeek =
      dto.daysOfWeek && dto.daysOfWeek.length > 0
        ? dto.daysOfWeek
        : dto.recurrence === 'SPECIFIC_DAYS' || dto.recurrence === 'WEEKLY'
        ? [fallbackDay]
        : [];

    const schedule = await this.prisma.client.medicationSchedule.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        doseMg: dto.doseMg,
        scheduleTime: scheduledDate,
        recurrence: dto.recurrence || 'ONCE',
        daysOfWeek,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        reminderEnabled: dto.reminderEnabled ?? false,
        isPaused: false,
        isTaken: false,
      } as any,
    });

    return {
      ...schedule,
      type: schedule.type ?? undefined,
      doseMg: schedule.doseMg ?? undefined,
    };
  }

  async markMedicationAsTaken(
    userId: string,
    scheduleId: string,
    isTakens: boolean,
    timezone?: string,
    targetDate?: string,
  ): Promise<any> {
    const schedule = await this.prisma.client.medicationSchedule.findFirst({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      throw new NotFoundException('Medication schedule not found');
    }

    const { dateStr } = getUserDayBoundaries(timezone, targetDate);

    if (isTakens) {
      await this.scheduleCompletionService.recordCompletion(
        userId,
        scheduleId,
        'MEDICATION',
        timezone,
        dateStr,
        10,
      );
    } else {
      await this.scheduleCompletionService.removeCompletion(
        userId,
        scheduleId,
        timezone,
        dateStr,
      );
    }

    const updated = await this.prisma.client.medicationSchedule.update({
      where: { id: scheduleId },
      data: {
        isTaken: isTakens,
        ...(isTakens && { lastTakenDate: new Date() }),
      } as any,
    });

    return updated;
  }

  async pauseMedicationSchedule(
    userId: string,
    scheduleId: string,
    isPaused: boolean,
  ): Promise<any> {
    const schedule = await this.prisma.client.medicationSchedule.findFirst({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      throw new NotFoundException('Medication schedule not found');
    }

    return this.prisma.client.medicationSchedule.update({
      where: { id: scheduleId },
      data: { isPaused } as any,
    });
  }

  async getMedicationScheduleHistory(
    userId: string,
  ): Promise<MedicationScheduleHistoryWithStatsDto> {
    const schedules = await this.prisma.client.medicationSchedule.findMany({
      where: { userId },
      orderBy: { scheduleTime: 'desc' },
    });

    const totalCount = schedules.length;

    return {
      totalCount,
      schedules: schedules.map((schedule) => ({
        ...schedule,
        type: schedule.type ?? undefined,
        doseMg: schedule.doseMg ?? undefined,
      })),
    };
  }

  async getTodaySchedules(
    userId: string,
    timezone?: string,
    targetDate?: string,
  ): Promise<TodaySchedulesDto> {
    const { startOfDay: startOfToday, endOfDay: endOfToday, dateStr } =
      getUserDayBoundaries(timezone, targetDate);

    const dayOfWeek = getIsoWeekday(timezone, targetDate);

    const allSchedules = await this.prisma.client.medicationSchedule.findMany({
      where: { userId },
      orderBy: { scheduleTime: 'asc' },
    });

    const activeToday = allSchedules.filter((schedule: any) => {
      if (schedule.isPaused) return false;
      if (schedule.startDate && new Date(schedule.startDate) > endOfToday) return false;
      if (schedule.endDate && new Date(schedule.endDate) < startOfToday) return false;

      if (schedule.recurrence === 'DAILY') return true;
      if (schedule.recurrence === 'WEEKLY' || schedule.recurrence === 'SPECIFIC_DAYS') {
        return Array.isArray(schedule.daysOfWeek) && schedule.daysOfWeek.includes(dayOfWeek);
      }
      // ONCE / default
      const schedTime = new Date(schedule.scheduleTime);
      return schedTime >= startOfToday && schedTime <= endOfToday;
    });

    const completedIds = await this.scheduleCompletionService.getCompletedScheduleIds(
      userId,
      dateStr,
      'MEDICATION',
    );

    return {
      totalToday: activeToday.length,
      schedules: activeToday.map((schedule: any) => {
        const isTakenToday = completedIds.has(schedule.id);
        return {
          ...schedule,
          isTaken: isTakenToday,
          type: schedule.type ?? undefined,
          doseMg: schedule.doseMg ?? undefined,
        };
      }),
    };
  }

  async getMedicationScheduleById(
    userId: string,
    id: string,
  ): Promise<MedicationScheduleResponseDto> {
    const schedule = await this.prisma.client.medicationSchedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      throw new NotFoundException('Medication schedule not found');
    }

    return {
      ...schedule,
      type: schedule.type ?? undefined,
      doseMg: schedule.doseMg ?? undefined,
    };
  }

  async updateMedicationSchedule(
    userId: string,
    id: string,
    dto: UpdateMedicationScheduleDto,
  ): Promise<MedicationScheduleResponseDto> {
    const existingSchedule =
      await this.prisma.client.medicationSchedule.findFirst({
        where: { id, userId },
      });

    if (!existingSchedule) {
      throw new NotFoundException('Medication schedule not found');
    }

    const normalizeBooleanValue = (value: unknown): boolean | undefined => {
      if (value === '' || value === undefined || value === null) {
        return undefined;
      }
      if (typeof value === 'string') {
        const normalized = value.trim().toLowerCase();
        if (['true', '1', 'on'].includes(normalized)) return true;
        if (['false', '0', 'off'].includes(normalized)) return false;
        return undefined;
      }
      if (typeof value === 'number') {
        if (value === 1) return true;
        if (value === 0) return false;
      }
      if (value === true || value === false) {
        return value;
      }
      return undefined;
    };

    const normalizedIsTaken = normalizeBooleanValue(dto.isTaken);

    if (normalizedIsTaken === true) {
      await this.scheduleCompletionService.recordCompletion(
        userId,
        id,
        'MEDICATION',
      );
    } else if (normalizedIsTaken === false) {
      await this.scheduleCompletionService.removeCompletion(
        userId,
        id,
      );
    }

    const schedule = await this.prisma.client.medicationSchedule.update({
      where: { id },
      data: {
        name: dto.name,
        type: dto.type,
        doseMg: dto.doseMg,
        scheduleTime: dto.scheduleTime ? new Date(dto.scheduleTime) : undefined,
        recurrence: dto.recurrence,
        daysOfWeek: dto.daysOfWeek,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        reminderEnabled: dto.reminderEnabled,
        isPaused: dto.isPaused,
        ...(normalizedIsTaken !== undefined && {
          isTaken: normalizedIsTaken,
          ...(normalizedIsTaken && { lastTakenDate: new Date() }),
        }),
      } as any,
    });

    return {
      ...schedule,
      type: schedule.type ?? undefined,
      doseMg: schedule.doseMg ?? undefined,
    };
  }

  async deleteMedicationSchedule(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    const schedule = await this.prisma.client.medicationSchedule.findFirst({
      where: { id, userId },
    });

    if (!schedule) {
      throw new NotFoundException('Medication schedule not found');
    }

    await this.prisma.client.medicationSchedule.delete({
      where: { id },
    });

    return { message: 'Medication schedule deleted successfully' };
  }
}
