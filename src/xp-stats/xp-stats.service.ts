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
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // Calculate the date of this Sunday
    const sundayDate = new Date(now);
    sundayDate.setDate(now.getDate() - currentDayOfWeek);
    sundayDate.setHours(0, 0, 0, 0);

    const chartData = [];
    const dayNames = ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

    // Iterate through each day of the week
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const dayStart = new Date(sundayDate);
      dayStart.setDate(sundayDate.getDate() + dayOffset);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date(dayStart);
      dayEnd.setHours(23, 59, 59, 999);

      // Get the actual day of the week for this specific date
      const dateDay = dayStart.getDay();
      const dayName = dayNames[dateDay];
      const dateString = dayStart.toISOString().split('T')[0];

      console.log(`[Weekly XP] ${dateString} = ${dayName} (dayOfWeek: ${dateDay})`);

      const logs = await this.prisma.client.xpLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const totalXp = logs.reduce((sum: number, log: any) => sum + log.amount, 0);

      chartData.push({
        day: dayName,
        date: dateString,
        xp: totalXp,
        logsCount: logs.length,
      });
    }

    return {
      period: 'week',
      data: chartData,
      totalXp: chartData.reduce((sum, day) => sum + day.xp, 0),
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
