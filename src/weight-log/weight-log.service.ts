import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import {
  CreateWeightLogDto,
  UpdateWeightLogDto,
} from './dto/create-weight-log.dto';
import {
  WeightLogResponseDto,
  WeeklyWeightChartDto,
  WeightChartDataDto,
  WeightHistoryWithStatsDto,
} from './dto/weight-log-response.dto';
import { LeveladdService } from '@/leveladd/leveladd.service';

@Injectable()
export class WeightLogService {
  constructor(
    private prisma: PrismaService,
    private leveladd: LeveladdService,
  ) { }

  async createWeightLog(
    userId: string,
    dto: CreateWeightLogDto,
  ): Promise<WeightLogResponseDto> {
    // Check if weight log already exists for today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const existingLog = await this.prisma.client.weightLog.findFirst({
      where: {
        userId,
        loggedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
    });

    if (existingLog) {
      throw new BadRequestException('Already claimed xp');
    }
    //if onboarded then add xp
    const earnedXp = 10;

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (user && !user.onBoarded) {
      await this.leveladd.addXpToUser(userId, earnedXp, 'Weight log entry');
    }

    const weightLog = await this.prisma.client.weightLog.create({
      data: {
        userId,
        weight: dto.weight,
        note: dto.note,
      },
    });

    // const claimedXP = await this.leveladd.addXpToUser(userId, 10);

    return {
      ...weightLog,
      note: weightLog.note ?? undefined,
    };
  }

  async getWeightHistory(userId: string): Promise<WeightHistoryWithStatsDto> {
    const weightLogs = await this.prisma.client.weightLog.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    // Calculate weight change for each log compared to previous log
    const history = weightLogs.map((log, index) => {
      let weightChange: string | undefined = undefined;
      let changeType: string | undefined = undefined;

      // Calculate change from previous log (next index since descending order)
      if (index < weightLogs.length - 1) {
        const currentWeight = parseFloat(log.weight);
        const previousWeight = parseFloat(weightLogs[index + 1].weight);
        const change = currentWeight - previousWeight;
        weightChange = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);

        // Determine change type with value
        const absChange = Math.abs(change).toFixed(1);
        if (change > 0) {
          changeType = `increase: ${absChange}`;
        } else if (change < 0) {
          changeType = `decrease: ${absChange}`;
        } else {
          changeType = 'stable: 0.0';
        }
      }

      return {
        ...log,
        note: log.note ?? undefined,
        weightChange,
        changeType,
      };
    });

    // Calculate stats
    const totalLogsCount = weightLogs.length;
    const currentWeight = weightLogs.length > 0 ? weightLogs[0].weight : null;

    let totalChanges: string | null = null;
    if (weightLogs.length > 1) {
      const firstWeight = parseFloat(weightLogs[weightLogs.length - 1].weight);
      const latestWeight = parseFloat(weightLogs[0].weight);
      const change = latestWeight - firstWeight;
      totalChanges = change > 0 ? `+${change.toFixed(1)}` : change.toFixed(1);
    }

    return {
      currentWeight,
      totalChanges,
      totalLogsCount,
      history,
    };
  }

  async getWeeklyWeightChart(userId: string): Promise<WeeklyWeightChartDto> {
    const now = new Date();
    const startOfThisWeek = this.getStartOfWeek(now);
    const startOfLastWeek = new Date(startOfThisWeek);
    startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

    // Get this week's data
    const thisWeekLogs = await this.prisma.client.weightLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: startOfThisWeek,
        },
      },
      orderBy: { loggedAt: 'asc' },
    });

    // Get last week's data
    const lastWeekLogs = await this.prisma.client.weightLog.findMany({
      where: {
        userId,
        loggedAt: {
          gte: startOfLastWeek,
          lt: startOfThisWeek,
        },
      },
      orderBy: { loggedAt: 'asc' },
    });

    // Format data for chart - convert lbs to kg
    const thisWeekData: WeightChartDataDto[] = thisWeekLogs.map((log) => ({
      date: log.loggedAt.toISOString().split('T')[0],
      weight: this.lbsToKg(parseFloat(log.weight)),
    }));

    const lastWeekData: WeightChartDataDto[] = lastWeekLogs.map((log) => ({
      date: log.loggedAt.toISOString().split('T')[0],
      weight: this.lbsToKg(parseFloat(log.weight)),
    }));

    // Calculate averages in kg
    const thisWeekAverage = this.calculateAverage(
      thisWeekLogs.map((log) => parseFloat(log.weight) * 0.453592),
    );
    const lastWeekAverage = this.calculateAverage(
      lastWeekLogs.map((log) => parseFloat(log.weight) * 0.453592),
    );

    // Calculate weekly change
    let weeklyChange: string | null = null;
    if (thisWeekAverage !== null && lastWeekAverage !== null) {
      const change = parseFloat(thisWeekAverage) - parseFloat(lastWeekAverage);
      weeklyChange = change.toFixed(1);
    }

    return {
      thisWeek: thisWeekData,
      lastWeek: lastWeekData,
      thisWeekAverage,
      lastWeekAverage,
      weeklyChange,
    };
  }

  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Sunday as start of week
    return new Date(d.setDate(diff));
  }

  private calculateAverage(weights: number[]): string | null {
    if (weights.length === 0) return null;
    const sum = weights.reduce((acc, weight) => acc + weight, 0);
    return (sum / weights.length).toFixed(1);
  }

  private lbsToKg(lbs: number): string {
    return (lbs * 0.453592).toFixed(1);
  }

  async getTodayWeightLog(
    userId: string,
  ): Promise<WeightLogResponseDto | null> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayLog = await this.prisma.client.weightLog.findFirst({
      where: {
        userId,
        loggedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { loggedAt: 'desc' },
    });

    if (!todayLog) return null;

    return {
      ...todayLog,
      note: todayLog.note ?? undefined,
    };
  }

  async updateTodayWeightLog(
    userId: string,
    dto: UpdateWeightLogDto,
  ): Promise<WeightLogResponseDto> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayLog = await this.prisma.client.weightLog.findFirst({
      where: {
        userId,
        loggedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { loggedAt: 'desc' },
    });

    if (!todayLog) {
      throw new NotFoundException('No weight log found for today');
    }

    const updatedLog = await this.prisma.client.weightLog.update({
      where: { id: todayLog.id },
      data: {
        ...(dto.weight && { weight: dto.weight }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });

    return {
      ...updatedLog,
      note: updatedLog.note ?? undefined,
    };
  }
}
