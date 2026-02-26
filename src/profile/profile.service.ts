import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { LeveladdService } from '@/leveladd/leveladd.service';
import { calculateLevel } from '@/leveladd/levelCalculator';
import { fitnessGoalDTO } from './dto/fitnessGoal.dto';
import { levelStatus } from '@/leveladd/levelStatus';
import { MealScheduleService } from '../meal-schedule/meal-schedule.service';
import { MedicationScheduleService } from '../medication-schedule/medication-schedule.service';
import { ExerciseLogService } from '../exercise-log/exercise-log.service';
import {
  ProfileWithSchedulesDto,
  TodayScheduleItemDto,
} from './dto/profile-with-schedules.dto';
import { XpStatsService } from '@/xp-stats/xp-stats.service';

export type ScheduleRange = 'today' | 'week' | 'month' | 'all';

@Injectable()
export class ProfileService {
  constructor(
    private prisma: PrismaService,
    private leveladdService: LeveladdService,
    private mealScheduleService: MealScheduleService,
    private medicationScheduleService: MedicationScheduleService,
    private exerciseLogService: ExerciseLogService,
    private xpStatsService: XpStatsService,
  ) { }

  async getProfile(userId: string) {
    let profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            userProfile: {
              select: {
                balanceXp: true,
              },
            },
            name: true,
          },
        },
      },
    });

    let level = calculateLevel(profile?.totalEarnXp || 0);

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await this.prisma.client.userProfile.create({
        data: { userId },
        include: {
          user: {
            select: {
              userProfile: {
                select: {
                  balanceXp: true,
                },
              },
              name: true,
            },
          },
        },
      });
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: userId }
    });

    console.log("user", user);

    console.log("profile:", profile);

    const [activeTheme, activecomponion, charts] = await Promise.all([
      this.prisma.client.userTheme.findFirst({
        where: { userId, isActive: true },
        select: {
          theme: true,
        },
      }),
      this.prisma.client.userCompanion.findFirst({
        where: { userId, isActive: true },
        select: {
          companion: true,
        },
      }),
      this.getProfileCharts(userId),
    ]);

    let finalProfile = {
      ...profile,
      profilePhoto: user?.profilePhoto || null,
      userName: profile?.user?.name || null,
      activeTheme: activeTheme,
      activeCompanion: activecomponion,
      level,
      levelStatus: levelStatus(level),
      // if level 50 or above, show then next level is max and xp required is 0
      nextLevel: {
        level: level >= 50 ? 50 : level + 1,
        xpRequired: level >= 50 ? 0 : 400 + level * 150,
      },
    };

    return {
      ...finalProfile,
      XPcharts: charts,
    };
  }

  async updateFitnessGoal(
    userId: string,
    updateFitnessGoalDto: fitnessGoalDTO,
  ) {
    let profile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await this.prisma.client.userProfile.create({
        data: { userId, fitnessGoal: updateFitnessGoalDto.goal },
      });
    } else {
      // Update existing profile
      profile = await this.prisma.client.userProfile.update({
        where: { userId },
        data: { fitnessGoal: updateFitnessGoalDto.goal },
      });
    }

    return profile;
  }

  quotes: any = {
    'Bookish / Fantasy Reader': [
      "Train as if you've just fallen through a portal and need to outrun a dragon.",
      "Because when the Dark Lord rises, you can't be winded after three steps.",
      "One day you may wake up in your favorite fantasy world. Don't be the side character who dies in chapter one.",
      'Do the squats. Future-you is climbing castle stairs in full armor.',
      'Every rep is one less reason the mercenary laughs at you in training camp.',
      "Your favorite heroine didn't quit halfway through the blood rite — neither will you.",
      "The librarian closes the book and whispers: 'It's your turn now.' Become the version that survives the enemies-to-lovers phase.",
      'This is foreplay for your villain era.',
      'Be strong enough to worry fictional men.',
    ],
    Gamer: [
      'Level up your stats one rep at a time.',
      "This is real life — there's no cheat code for endurance.",
      "Grind XP in the gym so you don't get one-shotted in battle.",
      "Your stamina bar isn't going to refill itself.",
      'Skill is built through repetition.',
      'Every attempt is XP.',
      "You don't grind for nothing.",
      "Level up happens when you don't quit.",
    ],
    Adventurer: [
      "You're not rolling a D20 for strength — you're building it.",
      "The dungeon doesn't wait for you to catch your breath.",
      'Every squat is a constitution boost.',
      "Your party is counting on you. Don't skip training.",
      'Steel is not forged in comfort, nor are warriors.',
      'The body you dream of is hidden beyond the battles you fear to fight.',
      'Discipline is the blade — sharpen it daily.',
      "Train as if the gates of your enemy's keep will fall tomorrow.",
      'Strength is the only language the mountains understand.',
      'Every drop of sweat is a rune carved into your destiny.',
      'Victory belongs to the relentless.',
    ],
    Mages: [
      'Discipline is the truest form of magic.',
      'Power is built, not summoned.',
      'Return daily. The arcane rewards consistency.',
      'Control precedes transformation.',
      'You are not weak — you are untrained.',
      'Every ritual sharpens your power.',
      'Mastery grows quiet before it grows visible.',
      'What you repeat, you become.',
      'The spell works because you do.',
      'Become more.',
    ],
  };

  async getRandomQuote(theme: any) {
    const pool = this.quotes[theme];
    if (!pool) return null;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async logXpChange(userId: string, xpAmount: number, reason?: string) {

    // find active theme
    const activeTheme = await this.prisma.client.userTheme.findFirst({
      where: { userId, isActive: true },
      select: { theme: true },
    });

    console.log('activeTheme', activeTheme);

    const logEntry = await this.leveladdService.addXpToUser(
      userId,
      xpAmount,
      reason,
    );

    const message = await this.getRandomQuote(activeTheme?.theme?.name);

    return { message: message, logEntry };
  }

  async addXp(userId: string, xpAmount: number) {
    try {
      let profile = await this.prisma.client.userProfile.findUnique({
        where: { userId },
      });

      if (!profile) {
        profile = await this.prisma.client.userProfile.create({
          data: { userId, level: 1, totalEarnXp: 0, balanceXp: 0 },
        });
      }

      const addXP = await this.leveladdService.addXpToUser(userId, xpAmount);

      return { message: 'XP added successfully', ...addXP };
    } catch (error) {
      console.log(error);

      error.message = 'Failed to add XP: ' + error.message;
      throw error;
    }
  }

  async claimDailyLoginXp(userId: string, xpAmount: number) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const checkLog = await this.prisma.client.xpLog.findFirst({
      where: {
        userId,
        source: 'dayliLoggin',
        createdAt: {
          gte: today,
        },
      },
    });

    if (checkLog) {
      return {
        success: false,
        message: 'Already XP claimed today',
      };
    }

    const logEntry = await this.leveladdService.addXpToUser(
      userId,
      xpAmount,
      'dayliLoggin',
    );

    return {
      success: true,
      message: 'Daily XP claimed successfully',
      logEntry,
    };
  }

  // Simple level calculation: Level = floor((totalEarnXp - 400) / 150) + 1
  private calculateLevel(totalEarnXp: number): number {
    return Math.floor((totalEarnXp - 400) / 150) + 1;
  }

  async getLeaderboard(limit: number = 10) {
    return this.prisma.client.userProfile.findMany({
      take: limit,
      orderBy: {
        totalEarnXp: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  private formatTimeToBasic(date: Date): string {
    const options = {
      timeZone: 'Asia/Dhaka',
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    };
    return new Intl.DateTimeFormat('en-US', options as any).format(date);
  }

  private getDateRange(type: 'week' | 'month'): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    if (type === 'week') {
      // Past 7 days including today
      start.setDate(start.getDate() - 6);
    } else if (type === 'month') {
      // Start of current month
      start.setDate(1);
    }

    return { start, end };
  }

  private buildCombinedSchedules(
    mealItems: any[],
    medicationItems: any[],
    exerciseItems: any[],
  ): TodayScheduleItemDto[] {
    const combined: TodayScheduleItemDto[] = [];
    combined.push(...mealItems, ...medicationItems, ...exerciseItems);
    combined.sort(
      (a, b) =>
        new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime(),
    );
    return combined;
  }

  private filterItemsByDateRange(
    mealSchedules: any[],
    medicationSchedules: any[],
    exerciseSchedules: any[],
    startDate: Date,
    endDate: Date,
  ): {
    meals: any[];
    medications: any[];
    exercises: any[];
  } {
    const filteredMeals = mealSchedules.filter(
      (m) =>
        new Date(m.scheduledAt) >= startDate &&
        new Date(m.scheduledAt) <= endDate,
    );

    const filteredMeds = medicationSchedules.filter(
      (m) =>
        new Date(m.scheduleTime) >= startDate &&
        new Date(m.scheduleTime) <= endDate,
    );

    const filteredExercises = exerciseSchedules.filter(
      (e) =>
        new Date(e.loggedAt) >= startDate && new Date(e.loggedAt) <= endDate,
    );

    return {
      meals: filteredMeals,
      medications: filteredMeds,
      exercises: filteredExercises,
    };
  }

  private normalizeScheduleRange(
    range?: string | ScheduleRange,
  ): ScheduleRange {
    if (!range) {
      return 'all';
    }

    const normalizedValue =
      typeof range === 'string' ? range.trim().toLowerCase() : range;
    const aliasMap: Record<string, ScheduleRange> = {
      today: 'today',
      week: 'week',
      thisweek: 'week',
      month: 'month',
      thismonth: 'month',
      all: 'all',
    };

    return aliasMap[normalizedValue as keyof typeof aliasMap] ?? 'all';
  }

  async getProfileWithSchedules(
    userId: string,
    range?: string | ScheduleRange,
  ): Promise<ProfileWithSchedulesDto> {
    // Get base profile
    const baseProfile = await this.getProfile(userId);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayMoodLog = await this.prisma.client.moodLog.findFirst({
      where: {
        userId,
        loggedAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
      },
      orderBy: { loggedAt: 'desc' },
      select: {
        id: true,
        mood: true,
        energyLevel: true,
        hungerLevel: true,
        note: true,
        loggedAt: true,
      },
    });

    const selectedRange = this.normalizeScheduleRange(range);
    const includeToday = selectedRange === 'all' || selectedRange === 'today';
    const includeWeek = selectedRange === 'all' || selectedRange === 'week';
    const includeMonth = selectedRange === 'all' || selectedRange === 'month';

    // Get all schedules (using larger limit for history)
    const [
      mealHistoryResult,
      medicationHistoryResult,
      exerciseScheduleHistory,
    ] = await Promise.all([
      this.mealScheduleService
        .getMealScheduleHistory(userId, 100, 0)
        .catch(() => ({ schedules: [], totalCount: 0, todaySummary: {} })),
      this.medicationScheduleService
        .getMedicationScheduleHistory(userId)
        .catch(() => ({ schedules: [], totalCount: 0 })),
      this.exerciseLogService
        .getExerciseScheduleHistory(userId)
        .catch(() => ({ schedules: [], totalCount: 0 })),
    ]);

    // Extract schedules from responses
    const mealSchedules = mealHistoryResult.schedules || [];
    const medicationSchedules = medicationHistoryResult.schedules || [];
    const exerciseSchedules = exerciseScheduleHistory.schedules || [];

    // Get date ranges
    const todayRange = this.getDateRange('week');
    todayRange.start = new Date();
    todayRange.start.setHours(0, 0, 0, 0);

    const weekRange = this.getDateRange('week');
    const monthRange = this.getDateRange('month');

    // Filter schedules by date range
    const todayFiltered = this.filterItemsByDateRange(
      mealSchedules,
      medicationSchedules,
      exerciseSchedules,
      todayRange.start,
      todayRange.end,
    );

    const weekFiltered = this.filterItemsByDateRange(
      mealSchedules,
      medicationSchedules,
      exerciseSchedules,
      weekRange.start,
      weekRange.end,
    );

    const monthFiltered = this.filterItemsByDateRange(
      mealSchedules,
      medicationSchedules,
      exerciseSchedules,
      monthRange.start,
      monthRange.end,
    );

    // Build combined schedules for today
    const todayMealItems = includeToday
      ? todayFiltered.meals.map((meal: any) => ({
        id: meal.id,
        type: 'meal' as const,
        title: meal.mealType,
        description: `${meal.calories || 0} kcal${meal.carbs || meal.protein || meal.fats
          ? ` • C: ${meal.carbs}g P: ${meal.protein}g F: ${meal.fats}g`
          : ''
          }`,
        scheduledAt: this.formatTimeToBasic(new Date(meal.scheduledAt)),
        details: {
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fats: meal.fats,
          isTaken: meal.isTaken ?? undefined,
        },
      }))
      : [];

    const todayMedicationItems = includeToday
      ? todayFiltered.medications.map((med: any) => ({
        id: med.id,
        type: 'medication' as const,
        title: med.name,
        description: `${med.type || 'Medication'}${med.doseMg ? ` • ${med.doseMg}mg` : ''}`,
        scheduledAt: this.formatTimeToBasic(new Date(med.scheduleTime)),
        details: {
          type: med.type,
          doseMg: med.doseMg,
          isTaken: med.isTaken ?? undefined,
        },
      }))
      : [];

    const todayExerciseItems = includeToday
      ? todayFiltered.exercises.map((exercise: any) => ({
        id: exercise.id,
        type: 'exercise' as const,
        title: exercise.name,
        description: `${exercise.type}${exercise.intensity ? ` • ${exercise.intensity}` : ''
          }${exercise.duration ? ` • ${exercise.duration} min` : ''}${exercise.note ? ` • ${exercise.note}` : ''
          }`,
        scheduledAt: this.formatTimeToBasic(new Date(exercise.loggedAt)),
        details: {
          type: exercise.type,
          intensity: exercise.intensity,
          duration: exercise.duration,
          note: exercise.note,
          isTaken: exercise.isTaken ?? undefined,
        },
      }))
      : [];

    // Build combined schedules for this week
    const weekMealItems = includeWeek
      ? weekFiltered.meals.map((meal: any) => ({
        id: meal.id,
        type: 'meal' as const,
        title: meal.mealType,
        description: `${meal.calories || 0} kcal${meal.carbs || meal.protein || meal.fats
          ? ` • C: ${meal.carbs}g P: ${meal.protein}g F: ${meal.fats}g`
          : ''
          }`,
        scheduledAt: this.formatTimeToBasic(new Date(meal.scheduledAt)),
        details: {
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fats: meal.fats,
          isTaken: meal.isTaken ?? undefined,
        },
      }))
      : [];

    const weekMedicationItems = includeWeek
      ? weekFiltered.medications.map((med: any) => ({
        id: med.id,
        type: 'medication' as const,
        title: med.name,
        description: `${med.type || 'Medication'}${med.doseMg ? ` • ${med.doseMg}mg` : ''}`,
        scheduledAt: this.formatTimeToBasic(new Date(med.scheduleTime)),
        details: {
          type: med.type,
          doseMg: med.doseMg,
          isTaken: med.isTaken ?? undefined,
        },
      }))
      : [];

    const weekExerciseItems = includeWeek
      ? weekFiltered.exercises.map((exercise: any) => ({
        id: exercise.id,
        type: 'exercise' as const,
        title: exercise.name,
        description: `${exercise.type}${exercise.intensity ? ` • ${exercise.intensity}` : ''
          }${exercise.duration ? ` • ${exercise.duration} min` : ''}${exercise.note ? ` • ${exercise.note}` : ''
          }`,
        scheduledAt: this.formatTimeToBasic(new Date(exercise.loggedAt)),
        details: {
          type: exercise.type,
          intensity: exercise.intensity,
          duration: exercise.duration,
          note: exercise.note,
          isTaken: exercise.isTaken ?? undefined,
        },
      }))
      : [];

    // Build combined schedules for this month
    const monthMealItems = includeMonth
      ? monthFiltered.meals.map((meal: any) => ({
        id: meal.id,
        type: 'meal' as const,
        title: meal.mealType,
        description: `${meal.calories || 0} kcal${meal.carbs || meal.protein || meal.fats
          ? ` • C: ${meal.carbs}g P: ${meal.protein}g F: ${meal.fats}g`
          : ''
          }`,
        scheduledAt: this.formatTimeToBasic(new Date(meal.scheduledAt)),
        details: {
          calories: meal.calories,
          carbs: meal.carbs,
          protein: meal.protein,
          fats: meal.fats,
          isTaken: meal.isTaken ?? undefined,
        },
      }))
      : [];

    const monthMedicationItems = includeMonth
      ? monthFiltered.medications.map((med: any) => ({
        id: med.id,
        type: 'medication' as const,
        title: med.name,
        description: `${med.type || 'Medication'}${med.doseMg ? ` • ${med.doseMg}mg` : ''}`,
        scheduledAt: this.formatTimeToBasic(new Date(med.scheduleTime)),
        details: {
          type: med.type,
          doseMg: med.doseMg,
          isTaken: med.isTaken ?? undefined,
        },
      }))
      : [];

    const monthExerciseItems = includeMonth
      ? monthFiltered.exercises.map((exercise: any) => ({
        id: exercise.id,
        type: 'exercise' as const,
        title: exercise.name,
        description: `${exercise.type}${exercise.intensity ? ` • ${exercise.intensity}` : ''
          }${exercise.duration ? ` • ${exercise.duration} min` : ''}${exercise.note ? ` • ${exercise.note}` : ''
          }`,
        scheduledAt: this.formatTimeToBasic(new Date(exercise.loggedAt)),
        details: {
          type: exercise.type,
          intensity: exercise.intensity,
          duration: exercise.duration,
          note: exercise.note,
          isTaken: exercise.isTaken ?? undefined,
        },
      }))
      : [];

    // Build final combined arrays
    const todayCombined = includeToday
      ? this.buildCombinedSchedules(
        todayMealItems,
        todayMedicationItems,
        todayExerciseItems,
      )
      : [];

    const weekCombined = includeWeek
      ? this.buildCombinedSchedules(
        weekMealItems,
        weekMedicationItems,
        weekExerciseItems,
      )
      : [];

    const monthCombined = includeMonth
      ? this.buildCombinedSchedules(
        monthMealItems,
        monthMedicationItems,
        monthExerciseItems,
      )
      : [];

    return {
      ...baseProfile,
      todaySchedules: {
        combined: todayCombined,
      },
      thisWeek: {
        combined: weekCombined,
        totalMeals: includeWeek ? weekMealItems.length : 0,
        totalMedications: includeWeek ? weekMedicationItems.length : 0,
        totalExercises: includeWeek ? weekExerciseItems.length : 0,
      },
      thisMonth: {
        combined: monthCombined,
        totalMeals: includeMonth ? monthMealItems.length : 0,
        totalMedications: includeMonth ? monthMedicationItems.length : 0,
        totalExercises: includeMonth ? monthExerciseItems.length : 0,
      },
      todayMood: todayMoodLog
        ? {
          id: todayMoodLog.id,
          mood: todayMoodLog.mood,
          energyLevel: todayMoodLog.energyLevel ?? null,
          hungerLevel: todayMoodLog.hungerLevel ?? null,
          note: todayMoodLog.note ?? null,
          loggedAt: todayMoodLog.loggedAt,
        }
        : null,
    };
  }

  async getWeeklyChartData(userId: string) {
    return this.xpStatsService.getWeeklyChartData(userId);
  }

  async getMonthlyChartData(userId: string) {
    return this.xpStatsService.getMonthlyChartData(userId);
  }

  private async getProfileCharts(userId: string) {
    const [weeklyChart, monthlyChart] = await Promise.all([
      this.xpStatsService.getWeeklyChartData(userId).catch((error) => {
        console.error('Failed to load weekly chart data', error);
        return null;
      }),
      this.xpStatsService.getMonthlyChartData(userId).catch((error) => {
        console.error('Failed to load monthly chart data', error);
        return null;
      }),
    ]);

    return {
      weekly: weeklyChart,
      monthly: monthlyChart,
    };
  }
}
