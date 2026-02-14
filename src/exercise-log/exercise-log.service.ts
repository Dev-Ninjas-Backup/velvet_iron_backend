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
  ExerciseLogResponseDto,
  ExerciseScheduleResponseDto,
  ExerciseScheduleDetailResponseDto,
  ExerciseScheduleHistoryDto,
} from './dto/exercise-log-response.dto';

@Injectable()
export class ExerciseLogService {
  constructor(private prisma: PrismaService) {}

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
    const logs = await this.prisma.client.exerciseLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    const totalCount = logs.length;

    return {
      totalCount,
      logs: logs.map((log) => this.mapToResponseDto(log)),
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
    const schedule = await this.prisma.client.exerciseScheduleLog.update({
      where: { id },
      data: {
        type: dto.type as any,
        name: dto.name,
        intensity: dto.intensity as any,
        duration: dto.duration,
        note: dto.note,
        loggedAt: dto.scheduledAt ? new Date(dto.scheduledAt) : undefined,
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
    };
  }}