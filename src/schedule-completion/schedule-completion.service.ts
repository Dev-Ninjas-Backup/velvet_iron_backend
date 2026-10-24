import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { LeveladdService } from '@/leveladd/leveladd.service';
import { getUserDateString } from '../common/utils/weekday.util';

@Injectable()
export class ScheduleCompletionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leveladd: LeveladdService,
  ) {}

  /**
   * Check if a schedule is completed on a specific local date ('YYYY-MM-DD')
   */
  async isCompletedOnDate(
    userId: string,
    scheduleId: string,
    dateStr: string,
  ): Promise<boolean> {
    const record = await (this.prisma.client as any).scheduleCompletion.findUnique({
      where: {
        userId_scheduleId_date: {
          userId,
          scheduleId,
          date: dateStr,
        },
      },
    });
    return Boolean(record?.isCompleted);
  }

  /**
   * Get completion records for multiple schedules on a specific date ('YYYY-MM-DD')
   */
  async getCompletionsForDate(
    userId: string,
    scheduleIds: string[],
    dateStr: string,
  ): Promise<Map<string, boolean>> {
    if (!scheduleIds.length) return new Map();

    const records = await (this.prisma.client as any).scheduleCompletion.findMany({
      where: {
        userId,
        date: dateStr,
        scheduleId: { in: scheduleIds },
      },
    });

    const completionMap = new Map<string, boolean>();
    for (const r of records) {
      completionMap.set(r.scheduleId, r.isCompleted);
    }
    return completionMap;
  }

  /**
   * Get all completed schedule IDs for a user on a given local date
   */
  async getCompletedScheduleIds(
    userId: string,
    dateStr: string,
    scheduleType?: string,
  ): Promise<Set<string>> {
    const records = await (this.prisma.client as any).scheduleCompletion.findMany({
      where: {
        userId,
        date: dateStr,
        isCompleted: true,
        ...(scheduleType && { scheduleType }),
      },
      select: {
        scheduleId: true,
      },
    });

    return new Set(records.map((r: any) => r.scheduleId));
  }

  /**
   * Record a completion for a schedule on a specific date (defaults to today in user's timezone).
   * Once completed on that date, it stays completed for that date.
   * Awards 10 XP strictly once per calendar date.
   */
  async recordCompletion(
    userId: string,
    scheduleId: string,
    scheduleType: 'WORKOUT' | 'MEDICATION' | 'MEAL' | 'GENERAL',
    timezone?: string,
    targetDateStr?: string,
    earnedXp: number = 10,
  ): Promise<{ record: any; xpAwarded: number }> {
    const resolvedDateStr = getUserDateString(timezone, targetDateStr);

    // Check if already completed on this date
    const existing = await (this.prisma.client as any).scheduleCompletion.findUnique({
      where: {
        userId_scheduleId_date: {
          userId,
          scheduleId,
          date: resolvedDateStr,
        },
      },
    });

    if (existing) {
      return { record: existing, xpAwarded: 0 };
    }

    const created = await (this.prisma.client as any).scheduleCompletion.create({
      data: {
        userId,
        scheduleId,
        scheduleType,
        date: resolvedDateStr,
        isCompleted: true,
        completedAt: new Date(),
        earnedXp,
      },
    });

    // Check user onboarding and award XP strictly once
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (user && user.onBoarded && earnedXp > 0) {
      const source =
        scheduleType === 'WORKOUT'
          ? 'Exercise Schedule log entry'
          : scheduleType === 'MEDICATION'
          ? 'Medication Schedule log entry'
          : scheduleType === 'MEAL'
          ? 'mealSchedule log entry'
          : `${scheduleType} Schedule completion: ${resolvedDateStr}`;

      await this.leveladd.addXpToUser(userId, earnedXp, source);
    }

    return { record: created, xpAwarded: earnedXp };
  }

  /**
   * Remove or unmark completion for a schedule on a specific date
   */
  async removeCompletion(
    userId: string,
    scheduleId: string,
    timezone?: string,
    targetDateStr?: string,
  ): Promise<void> {
    const resolvedDateStr = getUserDateString(timezone, targetDateStr);
    await (this.prisma.client as any).scheduleCompletion.deleteMany({
      where: {
        userId,
        scheduleId,
        date: resolvedDateStr,
      },
    });
  }
}
