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

@Injectable()
export class MedicationScheduleService {
  constructor(private prisma: PrismaService) { }

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
        isTaken: false,
      },
    });

    return {
      ...schedule,
      type: schedule.type ?? undefined,
      doseMg: schedule.doseMg ?? undefined,
    };
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

    const schedules = await this.prisma.client.medicationSchedule.findMany({
      where: {
        userId,
        scheduleTime: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { scheduleTime: 'asc' },
    });

    return {
      totalToday: schedules.length,
      schedules: schedules.map((schedule) => ({
        ...schedule,
        type: schedule.type ?? undefined,
        doseMg: schedule.doseMg ?? undefined,
      })),
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
        ...(normalizedIsTaken !== undefined && { isTaken: normalizedIsTaken }),
      },
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
