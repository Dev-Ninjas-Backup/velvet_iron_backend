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

@Injectable()
export class MedicationScheduleService {
  constructor(private prisma: PrismaService,private readonly leveladd: LeveladdService) { }

  async createMedicationSchedule(
    userId: string,
    dto: CreateMedicationScheduleDto,
  ): Promise<MedicationScheduleResponseDto> {
    const schedule = await this.prisma.client.medicationSchedule.create({
      data: {
        userId,
        name: dto.name,
        type: dto.type,
        doseMg: dto.doseMg,
        scheduleTime: new Date(dto.scheduleTime),
        recurrence: dto.recurrence || 'ONCE',
        daysOfWeek: dto.daysOfWeek || [],
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
  ): Promise<any> {
    const schedule = await this.prisma.client.medicationSchedule.findFirst({
      where: { id: scheduleId, userId },
    });

    if (!schedule) {
      throw new NotFoundException('Medication schedule not found');
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const alreadyTakenToday = Boolean(
      (schedule as any).lastTakenDate &&
        new Date((schedule as any).lastTakenDate) >= todayStart &&
        new Date((schedule as any).lastTakenDate) <= todayEnd,
    );

    const earnedXp = 10;
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    // Award XP strictly once per day when marked taken and user is onboarded
    if (!alreadyTakenToday && isTakens && user && user.onBoarded) {
      await this.leveladd.addXpToUser(
        userId,
        earnedXp,
        'Medication Schedule log entry',
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

  async getTodaySchedules(userId: string): Promise<TodaySchedulesDto> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const dayOfWeek = startOfToday.getDay() === 0 ? 7 : startOfToday.getDay();

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

    return {
      totalToday: activeToday.length,
      schedules: activeToday.map((schedule: any) => {
        const isTakenToday = Boolean(
          schedule.lastTakenDate &&
            new Date(schedule.lastTakenDate) >= startOfToday &&
            new Date(schedule.lastTakenDate) <= endOfToday,
        );
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
    // Check if schedule exists and belongs to user
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
        ...(normalizedIsTaken !== undefined && { isTaken: normalizedIsTaken }),
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
    // Check if schedule exists and belongs to user
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
