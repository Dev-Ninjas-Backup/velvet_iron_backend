import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { LeveladdService } from '../leveladd/leveladd.service';
import { LogWaterDto, UpdateWaterGoalDto, WaterUnit } from './dto/water-log.dto';
import { WaterTodayResponseDto } from './dto/water-today-response.dto';

const ML_PER_OZ = 29.5735;

@Injectable()
export class WaterLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leveladdService: LeveladdService,
  ) {}

  /**
   * Helper: Normalize amount into both mL and oz
   */
  private normalizeUnits(
    amount: number,
    unit: WaterUnit,
  ): { amountMl: number; amountOz: number } {
    if (unit === WaterUnit.OZ) {
      return {
        amountOz: Number(amount.toFixed(2)),
        amountMl: Number((amount * ML_PER_OZ).toFixed(2)),
      };
    } else {
      return {
        amountMl: Number(amount.toFixed(2)),
        amountOz: Number((amount / ML_PER_OZ).toFixed(2)),
      };
    }
  }

  /**
   * Log water intake (Quick-add or Custom amount)
   */
  async logWater(userId: string, dto: LogWaterDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
      include: { userProfile: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Default to user's preferred unit if not explicitly supplied
    const preferredUnit = user.userProfile?.waterUnit ?? WaterUnit.OZ;
    const unit = dto.unit ?? preferredUnit;
    const { amountMl, amountOz } = this.normalizeUnits(dto.amount, unit);

    const earnedXp = 5;

    // Award XP if user is not yet fully onboarded (or following existing xp award rules)
    if (!user.onBoarded) {
      await this.leveladdService.addXpToUser(
        userId,
        earnedXp,
        'Water potion intake entry',
      );
    }

    const log = await this.prisma.client.waterLog.create({
      data: {
        userId,
        amount: dto.amount,
        unit,
        amountMl,
        amountOz,
        earnedXp,
        loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
      },
    });

    return log;
  }

  /**
   * Get today's total water intake, goal, display format, and potion flask state
   */
  async getTodayWater(userId: string): Promise<WaterTodayResponseDto> {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    const preferredUnit = userProfile?.waterUnit ?? WaterUnit.OZ;
    const goal = userProfile?.dailyWaterGoal ?? (preferredUnit === WaterUnit.OZ ? 64 : 2000);

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todayLogs = await this.prisma.client.waterLog.findMany({
      where: {
        userId,
        loggedAt: { gte: startOfToday, lte: endOfToday },
      },
      orderBy: { loggedAt: 'desc' },
    });

    // Sum according to preferred unit
    let currentIntake = 0;
    if (preferredUnit === WaterUnit.OZ) {
      currentIntake = todayLogs.reduce((sum, l) => sum + (l.amountOz || 0), 0);
    } else {
      currentIntake = todayLogs.reduce((sum, l) => sum + (l.amountMl || 0), 0);
    }

    currentIntake = Number(currentIntake.toFixed(1));

    const fillPercentage = goal > 0 ? Number(((currentIntake / goal) * 100).toFixed(1)) : 0;
    const isGoalReached = currentIntake >= goal;

    // Visual flask fill level: 0.0 to 1.0
    const clampedFillLevel = Math.min(1.0, Math.max(0.0, Number((fillPercentage / 100).toFixed(2))));

    const unitLabel = preferredUnit === WaterUnit.OZ ? 'oz' : 'mL';
    const display = `${Math.round(currentIntake)} / ${Math.round(goal)} ${unitLabel}`;

    const quickAdds =
      preferredUnit === WaterUnit.OZ
        ? [8, 16, 24, 32]
        : [250, 500, 750, 1000];

    return {
      currentIntake,
      goal,
      unit: preferredUnit,
      display,
      fillPercentage,
      isGoalReached,
      potionFlask: {
        theme: 'mana_potion_blue',
        fillLevel: clampedFillLevel,
      },
      quickAdds,
      todayLogs: todayLogs.map((l) => ({
        id: l.id,
        amount: l.amount,
        unit: l.unit,
        amountMl: l.amountMl,
        amountOz: l.amountOz,
        earnedXp: l.earnedXp,
        loggedAt: l.loggedAt,
      })),
    };
  }

  /**
   * Update user daily water goal and preferred unit
   */
  async updateWaterGoal(userId: string, dto: UpdateWaterGoalDto) {
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const updated = await this.prisma.client.userProfile.update({
      where: { userId },
      data: {
        dailyWaterGoal: dto.dailyWaterGoal,
        waterUnit: dto.waterUnit,
      },
    });

    return {
      dailyWaterGoal: updated.dailyWaterGoal,
      waterUnit: updated.waterUnit,
      message: 'Water goal updated successfully',
    };
  }

  /**
   * Delete a water log entry
   */
  async deleteWaterLog(userId: string, id: string) {
    const log = await this.prisma.client.waterLog.findFirst({
      where: { id, userId },
    });

    if (!log) {
      throw new NotFoundException('Water log not found');
    }

    await this.prisma.client.waterLog.delete({
      where: { id },
    });

    return { success: true, message: 'Water log deleted successfully' };
  }
}

