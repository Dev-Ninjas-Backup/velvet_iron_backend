import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMoodLogDto } from './dto/create-mood-log.dto';
import { UpdateMoodLogDto } from './dto/update-mood-log.dto';
import {
  MoodLogResponseDto,
  MoodLogHistoryDto,
} from './dto/mood-log-response.dto';
import { LeveladdService } from '@/leveladd/leveladd.service';

@Injectable()
export class MoodLogService {
  constructor(
    private readonly prisma: PrismaService,
    private leveladdService: LeveladdService,
  ) {}

  async createMoodLog(
    userId: string,
    dto: CreateMoodLogDto,
  ): Promise<MoodLogResponseDto> {
    const normalize = (value?: string) => {
      if (value === undefined) {
        return undefined;
      }
      return value.trim().length === 0 ? undefined : value;
    };

    const mood = normalize(dto.mood as unknown as string) as
      | CreateMoodLogDto['mood']
      | undefined;
    const energyLevel = normalize(dto.energyLevel as unknown as string) as
      | CreateMoodLogDto['energyLevel']
      | undefined;
    const hungerLevel = normalize(dto.hungerLevel as unknown as string) as
      | CreateMoodLogDto['hungerLevel']
      | undefined;
    const note = normalize(dto.note);
    const loggedAt = normalize(dto.loggedAt);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const existingToday = await this.prisma.client.moodLog.findFirst({
      where: {
        userId,
        loggedAt: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { loggedAt: 'desc' },
    });

    if (existingToday) {
      return this.prisma.client.moodLog.update({
        where: { id: existingToday.id },
        data: {
          ...(mood !== undefined && { mood }),
          ...(energyLevel !== undefined && { energyLevel }),
          ...(hungerLevel !== undefined && { hungerLevel }),
          ...(note !== undefined && { note }),
          ...(loggedAt && { loggedAt: new Date(loggedAt) }),
        },
      });
    }

    if (mood === undefined) {
      throw new BadRequestException('Mood is required to create a new log');
    }
    const earnedXp = 10;
    //check onboarding status
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (user && !user.onBoarded) {
      const xpUpdate = await this.leveladdService.addXpToUser(
        userId,
        earnedXp,
        'Mood log entry',
      );
    }

    return this.prisma.client.moodLog.create({
      data: {
        userId,
        mood,
        energyLevel,
        hungerLevel,
        note,
        earnedXp,
        loggedAt: loggedAt ? new Date(loggedAt) : new Date(),
      },
    });
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

  async getTodayMoodLog(userId: string): Promise<MoodLogResponseDto | null> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayValue = await this.prisma.client.moodLog.findFirst({
      where: {
        userId,
        loggedAt: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { loggedAt: 'desc' },
    });

    console.log('asdfasdfasdfasdfaaaaaaaaaaaaaaaaaa' + todayValue);

    if (!todayValue) {
      throw new BadRequestException('No mood log found for today');
    }
    return todayValue;
  }

  async updateMoodLog(
    userId: string,
    logId: string,
    dto: UpdateMoodLogDto,
  ): Promise<MoodLogResponseDto> {
    const normalize = (value?: string) => {
      if (value === undefined) {
        return undefined;
      }
      return value.trim().length === 0 ? undefined : value;
    };

    const mood = normalize(dto.mood as unknown as string) as
      | UpdateMoodLogDto['mood']
      | undefined;
    const energyLevel = normalize(dto.energyLevel as unknown as string) as
      | UpdateMoodLogDto['energyLevel']
      | undefined;
    const hungerLevel = normalize(dto.hungerLevel as unknown as string) as
      | UpdateMoodLogDto['hungerLevel']
      | undefined;
    const note = normalize(dto.note);
    const loggedAt = normalize(dto.loggedAt);

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
        ...(mood !== undefined && { mood }),
        ...(energyLevel !== undefined && { energyLevel }),
        ...(hungerLevel !== undefined && { hungerLevel }),
        ...(note !== undefined && { note }),
        ...(loggedAt && { loggedAt: new Date(loggedAt) }),
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
