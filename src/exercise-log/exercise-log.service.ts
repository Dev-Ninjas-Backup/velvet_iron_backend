import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import {
  CreateExerciseLogDto,
  UpdateExerciseLogDto,
} from './dto/create-exercise-log.dto';
import {
  CreateExerciseScheduleDto,
  UpdateExerciseScheduleDto,
} from './dto/create-exercise-schedule.dto';
import {
  ExerciseLogHistoryDto,
  ExerciseHistoryLogDto,
  ExerciseLogResponseDto,
  ExerciseScheduleResponseDto,
  ExerciseScheduleDetailResponseDto,
  ExerciseScheduleHistoryDto,
} from './dto/exercise-log-response.dto';

@Injectable()
export class ExerciseLogService {
  constructor(private prisma: PrismaService) { }

  async createExerciseLog(
    userId: string,
    dto: CreateExerciseLogDto,
  ): Promise<ExerciseLogResponseDto> {
    const exerciseLog = await this.prisma.client.exerciseLog.create({
      data: {
        userId,
        type: dto.type as any,
        name: dto.name,
        intensity: dto.intensity as any,
        duration: dto.duration,
        note: dto.note,
      },
    });
    return this.mapToResponseDto(exerciseLog);
  }

  async getExerciseLogHistory(userId: string): Promise<ExerciseLogHistoryDto> {
    const [exerciseLogs, scheduleLogs] = await Promise.all([
      this.prisma.client.exerciseLog.findMany({ where: { userId } }),
      this.prisma.client.exerciseScheduleLog.findMany({ where: { userId } }),
    ]);

    const logs: ExerciseHistoryLogDto[] = [
      ...exerciseLogs.map((log) => ({
        id: log.id,
        userId: log.userId,
        type: log.type,
        name: log.name,
        intensity: log.intensity ?? undefined,
        duration: log.duration ?? undefined,
        note: log.note ?? undefined,
        isTaken: log.isTaken ?? false,
        loggedAt: log.loggedAt,
        scheduledAt: null,
        earnedXp: log.earnedXp ?? 0,
        entryType: 'LOG' as const,
      })),
      ...scheduleLogs.map((schedule) => ({
        id: schedule.id,
        userId: schedule.userId,
        type: schedule.type,
        name: schedule.name,
        intensity: schedule.intensity ?? undefined,
        duration: schedule.duration ?? undefined,
        note: schedule.note ?? undefined,
        isTaken: schedule.isTaken ?? false,
        loggedAt: schedule.loggedAt,
        scheduledAt: schedule.loggedAt,
        earnedXp: schedule.earnedXp ?? 0,
        entryType: 'SCHEDULE' as const,
      })),
    ];

    logs.sort((a, b) => {
      if (a.isTaken !== b.isTaken) {
        return a.isTaken ? 1 : -1;
      }

      const timeA = a.loggedAt ? new Date(a.loggedAt).getTime() : 0;
      const timeB = b.loggedAt ? new Date(b.loggedAt).getTime() : 0;
      return timeB - timeA;
    });

    const pendingCount = logs.filter((log) => !log.isTaken).length;
    const totalEarnedXp = logs
      .filter((log) => log.isTaken)
      .reduce((sum, log) => sum + (log.earnedXp ?? 0), 0);

    const nextSchedule =
      logs.find((log) => log.entryType === 'SCHEDULE' && !log.isTaken) ?? null;

    return {
      totalCount: logs.length,
      pendingCount,
      totalEarnedXp,
      nextSchedule,
      logs,
    };
  }

  async getExerciseSchedule(
    userId: string,
  ): Promise<ExerciseScheduleResponseDto[]> {
    const logs = await this.prisma.client.exerciseLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'asc' },
      take: 30,
    });

    return logs.map((log) => ({
      id: log.id,
      type: log.type,
      name: log.name,
      intensity: log.intensity || undefined,
      duration: log.duration || undefined,
      note: log.note || undefined,
      loggedAt: log.loggedAt,
      isTaken: log.isTaken
    }));
  }

  async getExerciseLogById(
    userId: string,
    id: string,
  ): Promise<ExerciseLogResponseDto> {
    const log = await this.prisma.client.exerciseLog.findFirst({
      where: { id, userId },
    });
    if (!log) {
      throw new Error('Exercise log not found');
    }
    return this.mapToResponseDto(log);
  }

  async updateExerciseLog(
    userId: string,
    id: string,
    dto: UpdateExerciseLogDto,
  ): Promise<ExerciseLogResponseDto> {
    const log = await this.prisma.client.exerciseLog.update({
      where: { id },
      data: {
        type: dto.type as any,
        name: dto.name,
        intensity: dto.intensity as any,
        duration: dto.duration,
        note: dto.note,
      },
    });
    return this.mapToResponseDto(log);
  }

  async deleteExerciseLog(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    await this.prisma.client.exerciseLog.delete({
      where: { id },
    });
    return { message: 'Exercise log deleted successfully' };
  }

  private mapToResponseDto(log: any): ExerciseLogResponseDto {
    return {
      id: log.id,
      type: log.type,
      name: log.name,
      intensity: log.intensity,
      duration: log.duration,
      note: log.note,
      loggedAt: log.loggedAt,
      isTaken: log.isTaken ?? undefined,
      earnedXp: log.earnedXp ?? 0,
    };
  }

  // Exercise Schedule Methods
  async createExerciseSchedule(
    userId: string,
    dto: CreateExerciseScheduleDto,
  ): Promise<ExerciseScheduleDetailResponseDto> {
    const schedule = await this.prisma.client.exerciseScheduleLog.create({
      data: {
        userId,
        type: dto.type as any,
        name: dto.name,
        intensity: dto.intensity as any,
        duration: dto.duration,
        note: dto.note,
        loggedAt: new Date(dto.scheduledAt),
        isTaken: false,
      },
    });
    return this.mapToScheduleResponseDto(schedule);
  }

  async getExerciseScheduleHistory(
    userId: string,
  ): Promise<ExerciseScheduleHistoryDto> {
    const schedules = await this.prisma.client.exerciseScheduleLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    const totalCount = schedules.length;

    return {
      totalCount,
      schedules: schedules.map((schedule) =>
        this.mapToScheduleResponseDto(schedule),
      ),
    };
  }

  async getExerciseScheduleById(
    userId: string,
    id: string,
  ): Promise<ExerciseScheduleDetailResponseDto> {
    const schedule = await this.prisma.client.exerciseScheduleLog.findFirst({
      where: { id, userId },
    });
    if (!schedule) {
      throw new Error('Exercise schedule not found');
    }
    return this.mapToScheduleResponseDto(schedule);
  }

  async updateExerciseSchedule(
    userId: string,
    id: string,
    dto: UpdateExerciseScheduleDto,
  ): Promise<ExerciseScheduleDetailResponseDto> {
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
    const schedule = await this.prisma.client.exerciseScheduleLog.update({
      where: { id },
      data: {
        type: dto.type as any,
        name: dto.name,
        intensity: dto.intensity as any,
        duration: dto.duration,
        note: dto.note,
        loggedAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
        ...(normalizedIsTaken !== undefined && { isTaken: normalizedIsTaken }),
      },
    });
    return this.mapToScheduleResponseDto(schedule);
  }

  async deleteExerciseSchedule(
    userId: string,
    id: string,
  ): Promise<{ message: string }> {
    await this.prisma.client.exerciseScheduleLog.delete({
      where: { id },
    });
    return { message: 'Exercise schedule deleted successfully' };
  }

  private mapToScheduleResponseDto(
    schedule: any,
  ): ExerciseScheduleDetailResponseDto {
    return {
      id: schedule.id,
      type: schedule.type,
      name: schedule.name,
      intensity: schedule.intensity || undefined,
      duration: schedule.duration || undefined,
      note: schedule.note || undefined,
      loggedAt: schedule.loggedAt,
      isTaken: schedule.isTaken ?? undefined,
    };
  }

  async getTodaySchedules(
    userId: string,
  ): Promise<ExerciseScheduleDetailResponseDto[]> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const schedules = await this.prisma.client.exerciseScheduleLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { loggedAt: 'asc' },
    });

    return schedules.map((schedule) =>
      this.mapToScheduleResponseDto(schedule),
    );
  }
}