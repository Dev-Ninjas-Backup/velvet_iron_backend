import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';
import { UpdateMoodLogDto } from './dto/update-mood-log.dto';
import {
  MoodLogResponseDto,
  MoodLogHistoryDto,
} from './dto/mood-log-response.dto';

@Injectable()
export class MoodLogService {
  constructor(private readonly prisma: PrismaService) {}

  async createMoodLog(
    userId: string,
    dto: CreateMoodLogDto,
  ): Promise<MoodLogResponseDto> {
    const moodLog = await this.prisma.client.moodLog.create({
      data: {
        userId,
        mood: dto.mood,
        energyLevel: dto.energyLevel,
        hungerLevel: dto.hungerLevel,
        note: dto.note,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
      },
    });

    return moodLog;
  }

  async getMoodLogHistory(
    userId: string,
    limit: number = 30,
    offset: number = 0,
  ): Promise<MoodLogHistoryDto> {
    const [logs, totalCount] = await Promise.all([
      this.prisma.client.moodLog.findMany({
        where: { userId },
        orderBy: { loggedAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.client.moodLog.count({ where: { userId } }),
    ]);

    const currentMood = logs.length > 0 ? logs[0].mood : null;

    return {
      logs,
      totalCount,
      currentMood,
    };
  }

  async getLatestMoodLog(userId: string): Promise<MoodLogResponseDto | null> {
    const log = await this.prisma.client.moodLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    return log;
  }

  async updateMoodLog(
    userId: string,
    logId: string,
    dto: UpdateMoodLogDto,
  ): Promise<MoodLogResponseDto> {
    // First verify the log belongs to the user
    const existingLog = await this.prisma.client.moodLog.findFirst({
      where: {
        id: logId,
        userId,
      },
    });

    if (!existingLog) {
      throw new Error('Mood log not found or does not belong to user');
    }

    // Update the log
    const updatedLog = await this.prisma.client.moodLog.update({
      where: { id: logId },
      data: {
        ...(dto.mood && { mood: dto.mood }),
        ...(dto.energyLevel && { energyLevel: dto.energyLevel }),
        ...(dto.hungerLevel && { hungerLevel: dto.hungerLevel }),
        ...(dto.note !== undefined && { note: dto.note }),
        ...(dto.loggedAt && { loggedAt: new Date(dto.loggedAt) }),
      },
    });

    return updatedLog;
  }

  async deleteMoodLog(userId: string, logId: string): Promise<void> {
    await this.prisma.client.moodLog.deleteMany({
      where: {
        id: logId,
        userId,
      },
    });
  }
}
