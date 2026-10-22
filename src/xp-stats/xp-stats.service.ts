import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';
import {
  getUserDayBoundaries,
  getUserWeekBoundaries,
  getUserDateMeta,
} from '@/common/utils/timezone.util';
import { XP_REWARDS } from '@/common/constants/xp.constants';

@Injectable()
export class XpStatsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Get today's total XP for a user
   */
  async getTodayXp(userId: string, timezone?: string, targetDate?: string) {
    const { startOfDay, endOfDay } = this.getTodayDateRange(timezone, targetDate);
    return this.getXpForPeriod(userId, startOfDay, endOfDay, 'today');
  }

  /**
   * Return the daily quest checklist with completion state.
   */
  async getTodayQuestXp(userId: string, timezone?: string, targetDate?: string) {
    const { startOfDay, endOfDay, dateStr } = this.getTodayDateRange(timezone, targetDate);
    const mainMealTypes = new Set(['BREAKFAST', 'LUNCH', 'DINNER']);

    const [
      medicationCount,
      medicationScheduleCount,
      mealLogs,
      mealSchedules,
      moodLogCount,
      exerciseLogAggregate,
      exerciseScheduleAggregate,
      todayXpAggregate,
      todayWaterLogs,
      todayStepLog,
      userProfile,
    ] = await Promise.all([
      this.prisma.client.medication.count({
        where: {
          userId,
          isTaken: true,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.client.medicationSchedule.count({
        where: {
          userId,
          isTaken: true,
          scheduleTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.client.mealLog.findMany({
        where: {
          userId,
          isTaken: true,
          loggedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          mealType: true,
          protein: true,
        },
      }),
      this.prisma.client.mealSchedule.findMany({
        where: {
          userId,
          isTaken: true,
          scheduledAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        select: {
          mealType: true,
          protein: true,
        },
      }),
      this.prisma.client.moodLog.count({
        where: {
          userId,
          loggedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.client.exerciseLog.aggregate({
        where: {
          userId,
          isTaken: true,
          loggedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { duration: true },
        _count: true,
      }),
      this.prisma.client.exerciseScheduleLog.aggregate({
        where: {
          userId,
          isTaken: true,
          loggedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { duration: true },
        _count: true,
      }),
      this.prisma.client.xpLog.aggregate({
        where: {
          userId,
          createdAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.prisma.client.waterLog.findMany({
        where: {
          userId,
          loggedAt: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      }),
      this.prisma.client.stepLog.findFirst({
        where: {
          userId,
          date: new Date(`${dateStr}T00:00:00.000Z`),
        },
      }),
      this.prisma.client.userProfile.findUnique({
        where: { userId },
      }),
    ]);

    const takenMainMeals = [...mealLogs, ...mealSchedules].filter((meal) =>
      mainMealTypes.has(meal.mealType),
    ).length;

    const hasSingleMealWith30gProtein = [...mealLogs, ...mealSchedules].some(
      (meal) => (meal.protein ?? 0) >= 30,
    );

    const exerciseLogDuration = Number(
      exerciseLogAggregate._sum?.duration ?? 0,
    );
    const exerciseScheduleDuration = Number(
      exerciseScheduleAggregate._sum?.duration ?? 0,
    );

    const totalExerciseDuration =
      exerciseLogDuration + exerciseScheduleDuration;

    const waterUnit = userProfile?.waterUnit ?? 'OZ';
    const waterGoal = userProfile?.dailyWaterGoal ?? (waterUnit === 'OZ' ? 64 : 2000);
    const todayWaterIntake = todayWaterLogs.reduce((sum, log) => {
      return sum + (waterUnit === 'OZ' ? (log.amountOz || 0) : (log.amountMl || 0));
    }, 0);

    const todayTotalXp = Number(todayXpAggregate._sum?.amount ?? 0);
    const todayLogCount = Number(todayXpAggregate._count ?? 0);
    const quests = [
      {
        id: 'track-your-shot',
        title: 'Track Your Shot',
        xp: XP_REWARDS.QUESTS.TRACK_YOUR_SHOT,
        description: 'Log your GLP-1 medication',
        isDone: medicationCount + medicationScheduleCount > 0,
      },
      {
        id: 'three-meals',
        title: 'Three Meals a Day',
        xp: XP_REWARDS.QUESTS.THREE_MEALS,
        description: 'Log breakfast, lunch, and dinner',
        isDone: takenMainMeals >= 3,
      },
      {
        id: 'mood-check',
        title: 'Mood Check',
        xp: XP_REWARDS.QUESTS.MOOD_CHECK,
        description: 'Log your mood and energy levels',
        isDone: moodLogCount > 0,
      },
      {
        id: 'step-master',
        title: 'Step Master',
        xp: XP_REWARDS.QUESTS.STEP_MASTER,
        description: 'Complete your daily step goal or walk at least 8,000 steps',
        isDone:
          (todayStepLog && todayStepLog.steps >= todayStepLog.goal) ||
          (todayStepLog && todayStepLog.steps >= 8000),
      },
      {
        id: 'protein-power',
        title: "Titan's Nourishment",
        xp: XP_REWARDS.QUESTS.TITANS_NOURISHMENT,
        description: 'Log a meal with 30g+ protein',
        isDone: hasSingleMealWith30gProtein,
      },
      {
        id: 'mana-infusion',
        title: 'Mana Infusion',
        xp: XP_REWARDS.QUESTS.MANA_INFUSION,
        description: 'Drink at least 80% of your daily water potion goal',
        isDone: waterGoal > 0 && todayWaterIntake >= waterGoal * 0.8,
      },
    ];

    return {
      todayTotalXp,
      todayLogCount,
      quests,
    };
  }

  /**
   * Get this week's total XP for a user (Sunday to Saturday) based on local timezone
   */
  async getWeeklyXp(userId: string, timezone: string = 'UTC') {
    const { startOfWeek, endOfWeek } = getUserWeekBoundaries(timezone);
    return this.getXpForPeriod(userId, startOfWeek, endOfWeek, 'week');
  }

  /**
   * Get this month's total XP for a user based on local timezone
   */
  async getMonthlyXp(userId: string, timezone: string = 'UTC') {
    const { dateStr } = getUserDayBoundaries(timezone);
    const [y, m] = dateStr.split('-').map(Number);

    // Month start: YYYY-MM-01
    const mm = String(m).padStart(2, '0');
    const startBounds = getUserDayBoundaries(timezone, `${y}-${mm}-01`);

    // Month end: last day of month
    const lastDayNum = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const dd = String(lastDayNum).padStart(2, '0');
    const endBounds = getUserDayBoundaries(timezone, `${y}-${mm}-${dd}`);

    return this.getXpForPeriod(userId, startBounds.startOfDay, endBounds.endOfDay, 'month');
  }

  /**
   * Get XP statistics for a specific period
   */
  private async getXpForPeriod(
    userId: string,
    startDate: Date,
    endDate: Date,
    period: string,
  ) {
    const logs = await this.prisma.client.xpLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        amount: true,
        source: true,
        createdAt: true,
      },
    });

    const totalXp = logs.reduce((sum: number, log: any) => sum + log.amount, 0);

    return {
      totalXp,
      period,
      startDate,
      endDate,
      logs,
    };
  }

  /**
   * Get all XP logs for a user with pagination
   */
  async getAllXpLogs(userId: string, skip: number = 0, take: number = 50) {
    const [logs, total] = await Promise.all([
      this.prisma.client.xpLog.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          amount: true,
          source: true,
          createdAt: true,
        },
      }),
      this.prisma.client.xpLog.count({
        where: { userId },
      }),
    ]);

    return {
      logs,
      total,
      skip,
      take,
    };
  }

  /**
   * Get XP statistics summary (today, week, month combined) in user timezone
   */
  async getXpSummary(userId: string, timezone: string = 'UTC') {
    const [today, week, month] = await Promise.all([
      this.getTodayXp(userId, timezone),
      this.getWeeklyXp(userId, timezone),
      this.getMonthlyXp(userId, timezone),
    ]);

    return {
      today: {
        totalXp: today.totalXp,
        logsCount: today.logs.length,
      },
      week: {
        totalXp: week.totalXp,
        logsCount: week.logs.length,
      },
      month: {
        totalXp: month.totalXp,
        logsCount: month.logs.length,
      },
    };
  }

  private async resolveUserTimezone(userId: string, timezone?: string): Promise<string> {
    if (timezone && timezone !== 'UTC') {
      return timezone;
    }
    const profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
      select: { timezone: true },
    });
    return profile?.timezone || 'America/Chicago';
  }

  /**
   * Get weekly chart data - Daily XP for each day of the current week (Sunday to Saturday)
   */
  async getWeeklyChartData(userId: string, timezone: string = 'UTC') {
    const resolvedTz = await this.resolveUserTimezone(userId, timezone);
    const { startOfWeek, endOfWeek, days } = getUserWeekBoundaries(resolvedTz, undefined, 0);

    const logsThisWeek = await this.prisma.client.xpLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<
      string,
      {
        dayName: string;
        displayDate: string;
        isoDate: string;
        xp: number;
        logsCount: number;
      }
    >();

    const dayOrder: { key: string; dayName: string; displayDate: string }[] = [];

    for (const day of days) {
      buckets.set(day.dateKey, {
        dayName: day.dayName,
        displayDate: day.displayDate,
        isoDate: day.dateKey,
        xp: 0,
        logsCount: 0,
      });
      dayOrder.push({
        key: day.dateKey,
        dayName: day.dayName,
        displayDate: day.displayDate,
      });
    }

    for (const log of logsThisWeek) {
      const meta = getUserDateMeta(log.createdAt, resolvedTz);
      const bucket = buckets.get(meta.dateKey);
      if (!bucket) {
        buckets.set(meta.dateKey, {
          dayName: meta.dayName,
          displayDate: meta.formatted,
          isoDate: meta.dateKey,
          xp: log.amount,
          logsCount: 1,
        });
        continue;
      }

      bucket.xp += log.amount;
      bucket.logsCount += 1;
    }

    const shortMap: Record<string, string> = {
      Sunday: 'Sun',
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
    };

    const chartData = dayOrder.map((day) => {
      const bucket = buckets.get(day.key)!;
      return {
        day: bucket.dayName,
        dayShort: shortMap[bucket.dayName] || bucket.dayName.substring(0, 3),
        dateLabel: bucket.displayDate,
        isoDate: bucket.isoDate,
        xp: bucket.xp,
        logsCount: bucket.logsCount,
      };
    });

    return {
      period: 'week',
      timezone: resolvedTz,
      data: chartData,
      totalXp: chartData.reduce((sum, day) => sum + day.xp, 0),
    };
  }

  /**
   * Get last week's chart data - Daily XP for each day of the previous week (Sunday to Saturday)
   */
  async getLastWeekChartData(userId: string, timezone: string = 'UTC') {
    const resolvedTz = await this.resolveUserTimezone(userId, timezone);
    const { startOfWeek, endOfWeek, days } = getUserWeekBoundaries(resolvedTz, undefined, -1);

    const logsLastWeek = await this.prisma.client.xpLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: startOfWeek,
          lte: endOfWeek,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<
      string,
      {
        dayName: string;
        displayDate: string;
        isoDate: string;
        xp: number;
        logsCount: number;
      }
    >();

    const dayOrder: { key: string; dayName: string; displayDate: string }[] = [];

    for (const day of days) {
      buckets.set(day.dateKey, {
        dayName: day.dayName,
        displayDate: day.displayDate,
        isoDate: day.dateKey,
        xp: 0,
        logsCount: 0,
      });
      dayOrder.push({
        key: day.dateKey,
        dayName: day.dayName,
        displayDate: day.displayDate,
      });
    }

    for (const log of logsLastWeek) {
      const meta = getUserDateMeta(log.createdAt, resolvedTz);
      const bucket = buckets.get(meta.dateKey);
      if (!bucket) {
        buckets.set(meta.dateKey, {
          dayName: meta.dayName,
          displayDate: meta.formatted,
          isoDate: meta.dateKey,
          xp: log.amount,
          logsCount: 1,
        });
        continue;
      }

      bucket.xp += log.amount;
      bucket.logsCount += 1;
    }

    const shortMap: Record<string, string> = {
      Sunday: 'Sun',
      Monday: 'Mon',
      Tuesday: 'Tue',
      Wednesday: 'Wed',
      Thursday: 'Thu',
      Friday: 'Fri',
      Saturday: 'Sat',
    };

    const chartData = dayOrder.map((day) => {
      const bucket = buckets.get(day.key)!;
      return {
        day: bucket.dayName,
        dayShort: shortMap[bucket.dayName] || bucket.dayName.substring(0, 3),
        dateLabel: bucket.displayDate,
        isoDate: bucket.isoDate,
        xp: bucket.xp,
        logsCount: bucket.logsCount,
      };
    });

    return {
      period: 'lastWeek',
      timezone: resolvedTz,
      data: chartData,
      totalXp: chartData.reduce((sum, day) => sum + day.xp, 0),
    };
  }

  /**
   * Get monthly chart data - Weekly XP for each week of the current month
   */
  async getMonthlyChartData(userId: string, timezone: string = 'UTC') {
    const resolvedTz = await this.resolveUserTimezone(userId, timezone);
    const { dateStr } = getUserDayBoundaries(resolvedTz);
    const [y, m] = dateStr.split('-').map(Number);
    const mm = String(m).padStart(2, '0');

    const firstDayBounds = getUserDayBoundaries(resolvedTz, `${y}-${mm}-01`);
    const lastDayNum = new Date(Date.UTC(y, m, 0)).getUTCDate();
    const lastDayBounds = getUserDayBoundaries(resolvedTz, `${y}-${mm}-${String(lastDayNum).padStart(2, '0')}`);

    const chartData = [];
    let weekStart = new Date(firstDayBounds.startOfDay);
    const endOfMonth = new Date(lastDayBounds.endOfDay);

    let weekNumber = 1;

    while (weekStart <= endOfMonth) {
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
      const actualWeekEnd = weekEnd > endOfMonth ? endOfMonth : weekEnd;

      const logs = await this.prisma.client.xpLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: weekStart,
            lte: actualWeekEnd,
          },
        },
      });

      const totalXp = logs.reduce(
        (sum: number, log: any) => sum + log.amount,
        0,
      );

      const startMeta = getUserDateMeta(weekStart, resolvedTz);
      const endMeta = getUserDateMeta(actualWeekEnd, resolvedTz);

      chartData.push({
        week: `Week ${weekNumber}`,
        startDate: startMeta.dateKey,
        endDate: endMeta.dateKey,
        xp: totalXp,
        logsCount: logs.length,
      });

      weekStart = new Date(actualWeekEnd.getTime() + 1);
      weekNumber++;
    }

    const monthNameFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: resolvedTz,
      month: 'long',
      year: 'numeric',
    });

    return {
      period: 'month',
      month: monthNameFormatter.format(firstDayBounds.startOfDay),
      timezone: resolvedTz,
      data: chartData,
      totalXp: chartData.reduce((sum, week) => sum + week.xp, 0),
    };
  }

  private getTodayDateRange(timezone?: string, targetDate?: string) {
    return getUserDayBoundaries(timezone, targetDate);
  }
}
