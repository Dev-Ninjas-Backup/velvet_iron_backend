import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
import {
  MealLogResponseDto,
  MealLogHistoryDto,
  MealHistoryEntryDto,
} from './dto/meal-log-response.dto';
import { LeveladdService } from '@/leveladd/leveladd.service';
import { XP_REWARDS } from '../common/constants/xp.constants';
import {
  getUserDayBoundaries,
  getUserWeekBoundaries,
  getUserDateMeta,
} from '../common/utils/timezone.util';

@Injectable()
export class MealLogService {
  constructor(
    private readonly prisma: PrismaService,
    private leveladdService: LeveladdService,
  ) {}

  /**
   * Calories = (Carb × 4) + (Protein × 4) + (Fat × 9)
   */
  private calculateCalories(
    carbs: number,
    protein: number,
    fats: number,
  ): number {
    return carbs * 4 + protein * 4 + fats * 9;
  }

  async createMealLog(
    userId: string,
    dto: CreateMealLogDto,
  ): Promise<MealLogResponseDto> {
    const calories = dto.calories !== undefined && dto.calories > 0
      ? Number(dto.calories)
      : this.calculateCalories(
          Number(dto.carbs),
          Number(dto.protein),
          Number(dto.fats),
        );

    //award XP to active onboarded users
    const earnedXp = XP_REWARDS.MEAL_LOG;
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (user && user.onBoarded) {
      await this.leveladdService.addXpToUser(
        userId,
        earnedXp,
        'Meal log entry',
      );
    }

    const mealLog = await this.prisma.client.mealLog.create({
      data: {
        userId,
        mealType: dto.mealType,
        description: dto.description,
        calories,
        carbs: Number(dto.carbs),
        protein: Number(dto.protein),
        fats: Number(dto.fats),
        earnedXp,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
      },
    });

    return mealLog;
  }

  async getMealLogHistory(
    userId: string,
    limit: number = 30,
    offset: number = 0,
    timezone?: string,
    targetDate?: string,
    filterLogsByDate: boolean = false,
  ): Promise<MealLogHistoryDto> {
    const normalizedLimit = Math.max(0, limit ?? 30);
    const normalizedOffset = Math.max(0, offset ?? 0);

    let resolvedTz = timezone;
    if (!resolvedTz || resolvedTz === 'UTC') {
      const profile = await this.prisma.client.userProfile.findUnique({
        where: { userId },
        select: { timezone: true },
      });
      resolvedTz = profile?.timezone || 'America/Chicago';
    }

    const { startOfDay, endOfDay, dateStr: resolvedDateStr } =
      getUserDayBoundaries(resolvedTz, targetDate);

    const { startOfWeek, endOfWeek } = getUserWeekBoundaries(
      resolvedTz,
      resolvedDateStr,
      0,
    );

    const [mealLogs, mealSchedules, targetDayLogs, activeMacroGoal, weekLogs] =
      await Promise.all([
        this.prisma.client.mealLog.findMany({
          where: { userId },
          orderBy: { loggedAt: 'desc' },
        }),
        this.prisma.client.mealSchedule.findMany({
          where: { userId },
          orderBy: { scheduledAt: 'desc' },
        }),
        this.prisma.client.mealLog.findMany({
          where: {
            userId,
            loggedAt: { gte: startOfDay, lte: endOfDay },
          },
        }),
        this.prisma.client.macroGoal.findFirst({
          where: {
            userId,
            createdAt: { lte: endOfDay },
          },
          orderBy: { createdAt: 'desc' },
        }).then(async (goal) => {
          if (goal) return goal;
          return this.prisma.client.macroGoal.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
          });
        }),
        this.prisma.client.mealLog.findMany({
          where: {
            userId,
            loggedAt: { gte: startOfWeek, lte: endOfWeek },
          },
          select: { loggedAt: true },
        }),
      ]);

    const consumed = {
      protein: targetDayLogs.reduce((sum, l) => sum + (l.protein || 0), 0),
      fat: targetDayLogs.reduce((sum, l) => sum + (l.fats || 0), 0),
      carb: targetDayLogs.reduce((sum, l) => sum + (l.carbs || 0), 0),
      calories: targetDayLogs.reduce((sum, l) => sum + (l.calories || 0), 0),
    };

    const daily = {
      calories: activeMacroGoal ? activeMacroGoal.calories : null,
      macroNeed: {
        protein: activeMacroGoal ? activeMacroGoal.protein : null,
        fat: activeMacroGoal ? activeMacroGoal.fat : null,
        carb: activeMacroGoal ? activeMacroGoal.carbs : null,
      },
    };

    const macroTargets = {
      protein: activeMacroGoal?.protein ?? 0,
      fat: activeMacroGoal?.fat ?? 0,
      carb: activeMacroGoal?.carbs ?? 0,
      calories: activeMacroGoal?.calories ?? 0,
    };

    const remaining = {
      protein: Math.max(0, macroTargets.protein - consumed.protein),
      fat: Math.max(0, macroTargets.fat - consumed.fat),
      carb: Math.max(0, macroTargets.carb - consumed.carb),
      calories: Math.max(0, macroTargets.calories - consumed.calories),
    };

    const loggedDayNames = new Set(
      weekLogs.map((l) =>
        getUserDateMeta(l.loggedAt, resolvedTz).dayName.toLowerCase(),
      ),
    );

    const weeklyPresent = {
      sunday: loggedDayNames.has('sunday'),
      monday: loggedDayNames.has('monday'),
      tuesday: loggedDayNames.has('tuesday'),
      wednesday: loggedDayNames.has('wednesday'),
      thursday: loggedDayNames.has('thursday'),
      friday: loggedDayNames.has('friday'),
      saturday: loggedDayNames.has('saturday'),
    };

    const combinedHistory: MealHistoryEntryDto[] = [
      ...mealLogs.map<MealHistoryEntryDto>((log) => ({
        id: log.id,
        userId: log.userId,
        mealType: log.mealType,
        description: log.description ?? null,
        calories: log.calories ?? null,
        carbs: log.carbs ?? null,
        protein: log.protein ?? null,
        fats: log.fats ?? null,
        loggedAt: log.loggedAt,
        isTaken: log.isTaken ?? true,
        earnedXp: log.earnedXp ?? 0,
        scheduledAt: null,
        entryType: 'LOG',
      })),
      ...mealSchedules.map<MealHistoryEntryDto>((schedule) => ({
        id: schedule.id,
        userId: schedule.userId,
        mealType: schedule.mealType,
        description: null,
        calories: schedule.calories ?? null,
        carbs: schedule.carbs ?? null,
        protein: schedule.protein ?? null,
        fats: schedule.fats ?? null,
        loggedAt: schedule.scheduledAt,
        isTaken: schedule.isTaken ?? false,
        earnedXp: schedule.earnedXp ?? 0,
        scheduledAt: schedule.scheduledAt,
        entryType: 'SCHEDULE',
      })),
    ];

    combinedHistory.sort((a, b) => {
      if (a.isTaken === b.isTaken) {
        return b.loggedAt.getTime() - a.loggedAt.getTime();
      }
      return a.isTaken ? 1 : -1;
    });

    const filteredHistory = filterLogsByDate
      ? combinedHistory.filter((entry) => {
          const entryTime = entry.loggedAt.getTime();
          return (
            entryTime >= startOfDay.getTime() && entryTime <= endOfDay.getTime()
          );
        })
      : combinedHistory;

    const totalCount = filteredHistory.length;
    const paginatedHistory =
      normalizedLimit === 0
        ? []
        : filteredHistory.slice(
            normalizedOffset,
            normalizedOffset + normalizedLimit,
          );

    const totalEarnedXp = filteredHistory
      .filter((entry) => entry.isTaken)
      .reduce((sum, entry) => sum + (entry.earnedXp ?? 0), 0);

    const nextSchedule =
      combinedHistory.find(
        (entry) => entry.entryType === 'SCHEDULE' && !entry.isTaken,
      ) ?? null;

    return {
      daily,
      consumed,
      remaining,
      weeklyPresent,
      logs: paginatedHistory,
      totalCount,
      totalEarnedXp,
      nextSchedule,
    };
  }

  async getLatestMealLog(userId: string): Promise<MealLogResponseDto | null> {
    const log = await this.prisma.client.mealLog.findFirst({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
    });

    return log;
  }

  async updateMealLog(
    userId: string,
    logId: string,
    dto: UpdateMealLogDto,
  ): Promise<MealLogResponseDto> {
    // 1️⃣ Fetch existing log
    const existingLog = await this.prisma.client.mealLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existingLog) {
      throw new NotFoundException(
        'Meal log not found or does not belong to user',
      );
    }

    // 2️⃣ Use updated macros if provided, else fallback
    const carbs = dto.carbs ?? existingLog.carbs;
    const protein = dto.protein ?? existingLog.protein;
    const fats = dto.fats ?? existingLog.fats;

    console.log('ddddddddddddddd', dto);

    // 3️⃣ Recalculate or override calories
    let calories: number;
    if (dto.calories !== undefined && dto.calories > 0) {
      calories = Number(dto.calories);
    } else if (dto.calories === 0) {
      calories = this.calculateCalories(carbs ?? 0, protein ?? 0, fats ?? 0);
    } else if (existingLog.calories !== null && existingLog.calories > 0 && dto.carbs === undefined && dto.protein === undefined && dto.fats === undefined) {
      // Keep existing override if macros weren't changed
      calories = existingLog.calories;
    } else {
      calories = this.calculateCalories(carbs ?? 0, protein ?? 0, fats ?? 0);
    }

    // 4️⃣ Update the log
    const updatedLog = await this.prisma.client.mealLog.update({
      where: { id: logId },
      data: {
        // only update if provided
        ...(dto.mealType !== undefined && { mealType: dto.mealType }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.carbs !== undefined && { carbs }),
        ...(dto.protein !== undefined && { protein }),
        ...(dto.fats !== undefined && { fats }),
        calories,
        ...(dto.loggedAt !== undefined && { loggedAt: new Date(dto.loggedAt) }),
      },
    });

    return updatedLog;
  }

  async deleteMealLog(userId: string, logId: string): Promise<void> {
    await this.prisma.client.mealLog.deleteMany({
      where: { id: logId, userId },
    });
  }
}
