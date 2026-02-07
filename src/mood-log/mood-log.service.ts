import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';
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

  async deleteMoodLog(userId: string, logId: string): Promise<void> {
    await this.prisma.client.moodLog.deleteMany({
      where: {
        id: logId,
        userId,
      },
    });
  }
}
