import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/lib/prisma/prisma.service';

@Injectable()
export class XpStatsService {
  constructor(private prisma: PrismaService) { }

  /**
   * Get today's total XP for a user
   */
  async getTodayXp(userId: string) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.getXpForPeriod(userId, startOfDay, endOfDay, 'today');
  }

  /**
   * Get this week's total XP for a user (Sunday to Saturday)
   */
  async getWeeklyXp(userId: string) {
    const now = new Date();
    // Calculate the most recent Sunday
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.getXpForPeriod(userId, startOfWeek, endOfWeek, 'week');
  }

  /**
   * Get this month's total XP for a user
   */
  async getMonthlyXp(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    return this.getXpForPeriod(userId, startOfMonth, endOfMonth, 'month');
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
   * Get XP statistics summary (today, week, month combined)
   */
  async getXpSummary(userId: string) {
    const [today, week, month] = await Promise.all([
      this.getTodayXp(userId),
      this.getWeeklyXp(userId),
      this.getMonthlyXp(userId),
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

  /**
   * Get weekly chart data - Daily XP for each day of the current week (Sunday to Saturday)
   */
  async getWeeklyChartData(userId: string) {
    const now = new Date();
    const currentDayOfWeek = now.getDay();

    const sundayDate = new Date(now);
    sundayDate.setDate(now.getDate() - currentDayOfWeek);
    sundayDate.setHours(0, 0, 0, 0);

    const saturdayDate = new Date(sundayDate);
    saturdayDate.setDate(sundayDate.getDate() + 6);
    saturdayDate.setHours(23, 59, 59, 999);

    const logsThisWeek = await this.prisma.client.xpLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: sundayDate,
          lte: saturdayDate,
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const buckets = new Map<string, {
      dayName: string;
      displayDate: string;
      isoDate: string;
      xp: number;
      logsCount: number;
    }>();

    const dayOrder: { key: string; dayName: string; displayDate: string }[] = [];

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayStart = new Date(sundayDate);
      dayStart.setDate(sundayDate.getDate() + dayOffset);

      const meta = this.getBangladeshDateMeta(dayStart);
      buckets.set(meta.dateKey, {
        dayName: meta.dayName,
        displayDate: meta.formatted,
        isoDate: meta.dateKey,
        xp: 0,
        logsCount: 0,
      });
      dayOrder.push({ key: meta.dateKey, dayName: meta.dayName, displayDate: meta.formatted });
    }

    for (const log of logsThisWeek) {
      const meta = this.getBangladeshDateMeta(log.createdAt);
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

    const chartData = dayOrder.map((day) => {
      const bucket = buckets.get(day.key)!;
      return {
        day: bucket.dayName,
        dateLabel: bucket.displayDate,
        isoDate: bucket.isoDate,
        xp: bucket.xp,
        logsCount: bucket.logsCount,
      };
    });

    return {
      period: 'week',
      timezone: 'Asia/Dhaka',
      data: chartData,
      totalXp: chartData.reduce((sum, day) => sum + day.xp, 0),
    };
  }

  private getBangladeshDateMeta(date: Date) {
    const fullFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    });

    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
    });

    const dateKeyFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Dhaka',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    const formatted = fullFormatter.format(date);
    const dayName = dayFormatter.format(date);
    const parts = dateKeyFormatter.formatToParts(date);
    const year = parts.find((part) => part.type === 'year')?.value ?? '';
    const month = parts.find((part) => part.type === 'month')?.value ?? '';
    const day = parts.find((part) => part.type === 'day')?.value ?? '';

    return {
      formatted,
      dayName,
      dateKey: `${year}-${month}-${day}`,
    };
  }

  /**
   * Get monthly chart data - Weekly XP for each week of the current month
   */
  async getMonthlyChartData(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const chartData = [];
    let weekStart = new Date(startOfMonth);
    weekStart.setHours(0, 0, 0, 0);

    let weekNumber = 1;

    while (weekStart <= endOfMonth) {
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // Don't exceed the month
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

      const totalXp = logs.reduce((sum: number, log: any) => sum + log.amount, 0);

      chartData.push({
        week: `Week ${weekNumber}`,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: actualWeekEnd.toISOString().split('T')[0],
        xp: totalXp,
        logsCount: logs.length,
      });

      weekStart = new Date(weekEnd);
      weekStart.setDate(weekEnd.getDate() + 1);
      weekStart.setHours(0, 0, 0, 0);
      weekNumber++;
    }

    return {
      period: 'month',
      month: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      data: chartData,
      totalXp: chartData.reduce((sum, week) => sum + week.xp, 0),
    };
  }
}
