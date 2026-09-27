import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMacroGoalDto } from './dto/create-macro-goal.dto';
import { UpdateMacroGoalDto } from './dto/update-macro-goal.dto';

@Injectable()
export class MacroGoalService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate calories from macronutrients
   * Calories = (Carbs × 4) + (Fat × 9) + (Protein × 4)
   */
  private calculateCalories(carbs: number, fat: number, protein: number): number {
    return carbs * 4 + fat * 9 + protein * 4;
  }

  /**
   * Helper to sync calorieGoal & calorieGoalMode to userProfile
   */
  private async syncProfileCalorieGoal(
    userId: string,
    calorieGoal: number,
    calorieGoalMode: 'AUTO' | 'MANUAL',
  ) {
    try {
      await this.prisma.client.userProfile.updateMany({
        where: { userId },
        data: {
          calorieGoal,
          calorieGoalMode,
        },
      });
    } catch {
      // Ignored if profile does not exist yet
    }
  }

  /**
   * Create a new macro goal with independent calorie goal support
   */
  async createMacroGoal(userId: string, dto: CreateMacroGoalDto) {
    const rawCalories = dto.calorieGoal ?? dto.calories;
    const mode =
      dto.calorieGoalMode ??
      (rawCalories !== undefined && rawCalories !== null && rawCalories > 0 ? 'MANUAL' : 'AUTO');

    const calories =
      mode === 'MANUAL' && rawCalories !== undefined && rawCalories !== null && rawCalories > 0
        ? Number(rawCalories)
        : this.calculateCalories(dto.carbs, dto.fat, dto.protein);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existingToday = await this.prisma.client.macroGoal.findFirst({
      where: {
        userId,
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    let savedGoal;
    if (existingToday) {
      savedGoal = await this.prisma.client.macroGoal.update({
        where: { id: existingToday.id },
        data: {
          name: dto.name,
          carbs: dto.carbs,
          fat: dto.fat,
          protein: dto.protein,
          calories,
          calorieGoalMode: mode,
        },
      });
    } else {
      savedGoal = await this.prisma.client.macroGoal.create({
        data: {
          userId,
          name: dto.name,
          carbs: dto.carbs,
          fat: dto.fat,
          protein: dto.protein,
          calories,
          calorieGoalMode: mode,
        },
      });
    }

    await this.syncProfileCalorieGoal(userId, calories, mode);
    return savedGoal;
  }

  /**
   * Get all macro goals for a user
   */
  async getAllMacroGoals(userId: string) {
    const macroGoals = await this.prisma.client.macroGoal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return macroGoals || [];
  }

  /**
   * Get a specific macro goal by ID
   */
  async getMacroGoalById(userId: string, id: string) {
    const macroGoal = await this.prisma.client.macroGoal.findFirst({
      where: { id, userId },
    });

    if (!macroGoal) {
      throw new NotFoundException('Macro goal not found');
    }

    return macroGoal;
  }

  /**
   * Get current nutrition goals directly returning independent calorieGoal
   */
  async getNutritionGoals(userId: string) {
    const [latestMacro, userProfile] = await Promise.all([
      this.prisma.client.macroGoal.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.userProfile.findUnique({
        where: { userId },
      }),
    ]);

    const calorieGoalMode =
      latestMacro?.calorieGoalMode ?? userProfile?.calorieGoalMode ?? 'AUTO';
    const calorieGoal =
      latestMacro?.calories ??
      userProfile?.calorieGoal ??
      (latestMacro ? this.calculateCalories(latestMacro.carbs, latestMacro.fat, latestMacro.protein) : 2000);

    return {
      success: true,
      data: {
        calorieGoal,
        calorieGoalMode,
        carbs: latestMacro?.carbs ?? 200,
        protein: latestMacro?.protein ?? 150,
        fat: latestMacro?.fat ?? 60,
        name: latestMacro?.name ?? 'Daily Targets',
      },
    };
  }

  /**
   * Update a macro goal: respects calorieGoalMode == "MANUAL" without recomputing calories
   */
  async updateMacroGoal(userId: string, id: string, dto: UpdateMacroGoalDto) {
    const macroGoal = await this.getMacroGoalById(userId, id);

    const carbs = dto.carbs !== undefined ? dto.carbs : macroGoal.carbs;
    const fat = dto.fat !== undefined ? dto.fat : macroGoal.fat;
    const protein = dto.protein !== undefined ? dto.protein : macroGoal.protein;

    const mode =
      dto.calorieGoalMode !== undefined
        ? dto.calorieGoalMode
        : macroGoal.calorieGoalMode ?? 'AUTO';

    let calories: number;
    const explicitCalories = dto.calorieGoal ?? dto.calories;

    if (explicitCalories !== undefined && explicitCalories !== null && explicitCalories > 0) {
      // User explicitly passed a calorie value
      calories = Number(explicitCalories);
    } else if (mode === 'MANUAL') {
      // MANUAL MODE: Preserve existing stored calorieGoal without recomputing!
      calories = macroGoal.calories;
    } else if (dto.carbs !== undefined || dto.fat !== undefined || dto.protein !== undefined) {
      // AUTO MODE: Recompute from macros
      calories = this.calculateCalories(carbs, fat, protein);
    } else {
      calories = macroGoal.calories;
    }

    const updatedMacroGoal = await this.prisma.client.macroGoal.update({
      where: { id },
      data: {
        name: dto.name !== undefined ? dto.name : macroGoal.name,
        carbs,
        fat,
        protein,
        calories,
        calorieGoalMode: mode,
      },
    });

    await this.syncProfileCalorieGoal(userId, calories, mode);
    return updatedMacroGoal;
  }

  /**
   * Delete a macro goal
   */
  async deleteMacroGoal(userId: string, id: string) {
    const macroGoal = await this.getMacroGoalById(userId, id);

    await this.prisma.client.macroGoal.delete({
      where: { id },
    });

    return { message: 'Macro goal deleted successfully', id };
  }
}
