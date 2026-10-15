import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { LeveladdService } from '../leveladd/leveladd.service';
import { UpdateStepsDto, UpdateStepGoalDto } from './dto/step-log.dto';
import {
  StepTodayResponseDto,
  SetUpCampResponseDto,
} from './dto/step-today-response.dto';
import {
  JOURNEY_MILESTONES,
  CANONICAL_EXPEDITION_MILESTONES,
  getUnlockedExpeditionMilestone,
  getNextExpeditionMilestone,
} from './constants/step-journey.constants';
import { getUserDayBoundaries } from '../common/utils/timezone.util';

@Injectable()
export class StepLogService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leveladdService: LeveladdService,
  ) {}

  /**
   * Helper: Normalizes a date to start of day in UTC (matches @db.Date in Prisma)
   * Takes user timezone into account to determine what calendar day it is for the user.
   */
  private getNormalizedDate(timezone?: string, dateStr?: string): Date {
    const { dateStr: resolvedDateStr } = getUserDayBoundaries(timezone, dateStr);
    return new Date(`${resolvedDateStr}T00:00:00.000Z`);
  }

  /**
   * Helper: Normalizes companion name key
   */
  private normalizeCompanionKey(name?: string | null): string {
    const normalized = (name || '').toLowerCase().trim();
    if (normalized.includes('thyra')) return 'thyra';
    if (normalized.includes('leon')) return 'leon';
    if (normalized.includes('visepheron')) return 'visepheron';
    return 'riven';
  }

  /**
   * Get or create today's StepLog record and construct fantasy map journey state
   */
  async getTodaySteps(
    userId: string,
    timezone?: string,
    targetDate?: string,
  ): Promise<StepTodayResponseDto> {
    const today = this.getNormalizedDate(timezone, targetDate);

    const [userProfile, stepLog] = await Promise.all([
      this.prisma.client.userProfile.findUnique({
        where: { userId },
        include: { activeCompanion: true },
      }),
      this.prisma.client.stepLog.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      }),
    ]);

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const goal = stepLog?.goal ?? userProfile.dailyStepGoal ?? 8000;
    const steps = stepLog?.steps ?? 0;
    const isCampSet = stepLog?.isCampSet ?? false;
    const campSetAt = stepLog?.campSetAt ?? null;

    const percentage = goal > 0 ? Number(((steps / goal) * 100).toFixed(1)) : 0;
    const isGoalReached = steps >= goal;
    const progressRatio = Math.min(1.0, Math.max(0.0, Number((percentage / 100).toFixed(2))));

    // Milestone & Lore computation
    const companionKey = this.normalizeCompanionKey(userProfile.activeCompanion?.name);
    const reachedMilestones = JOURNEY_MILESTONES.filter((m) => percentage >= m.percentage);
    const lastReached = reachedMilestones[reachedMilestones.length - 1] ?? null;
    const nextMilestone = JOURNEY_MILESTONES.find((m) => percentage < m.percentage) ?? null;

    const currentLandmark = lastReached ? lastReached.name : 'The Starting Outpost';
    const nextLandmark = nextMilestone ? nextMilestone.name : 'Destination Secured';
    const activeLore = lastReached
      ? lastReached.lore
      : 'You stand at the gate of the outpost, preparing your boots for the path ahead.';

    const companionReaction = lastReached?.companionQuote[companionKey];

    // Cumulative lifetime steps: stored total + today's current steps (if camp not yet pitched)
    const lifetimeSteps = userProfile.lifetimeSteps + (isCampSet ? 0 : steps);

    const unlockedExpedition = getUnlockedExpeditionMilestone(lifetimeSteps);
    const nextExpedition = getNextExpeditionMilestone(lifetimeSteps);

    return {
      steps,
      goal,
      display: `${steps.toLocaleString()} / ${goal.toLocaleString()} steps`,
      percentage,
      isGoalReached,
      isCampSet,
      campSetAt,
      lifetimeSteps,
      totalCampsites: userProfile.totalCampsites,
      fantasyMap: {
        currentLandmark,
        nextLandmark,
        progressRatio,
        unlockedMilestones: reachedMilestones.map((m) => m.percentage),
        activeLore,
        companionReaction,
        canonicalMilestoneIndex: unlockedExpedition ? unlockedExpedition.index : null,
        canonicalMilestoneName: unlockedExpedition ? unlockedExpedition.name : null,
        nextCanonicalMilestoneName: nextExpedition ? nextExpedition.name : null,
        nextCanonicalMilestoneSteps: nextExpedition ? nextExpedition.stepsRequired : null,
      },
    };
  }

  /**
   * Enter or increment steps for the day
   */
  async updateSteps(userId: string, dto: UpdateStepsDto) {
    const targetDate = this.getNormalizedDate(dto.date);

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    const existingLog = await this.prisma.client.stepLog.findUnique({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
    });

    if (existingLog?.isCampSet) {
      throw new BadRequestException(
        "Camp has already been pitched for today. Today's steps are locked.",
      );
    }

    let finalSteps = 0;
    if (dto.steps !== undefined) {
      finalSteps = dto.steps;
    } else if (dto.addSteps !== undefined) {
      finalSteps = (existingLog?.steps ?? 0) + dto.addSteps;
    } else {
      throw new BadRequestException('Either "steps" or "addSteps" must be provided.');
    }

    // Anti-Abuse: Max Daily Walking Limit (50,000 steps)
    const MAX_DAILY_STEPS = 50000;
    if (finalSteps > MAX_DAILY_STEPS) {
      throw new BadRequestException(
        'Daily walking limit reached (50,000 steps). Rest your legs, traveler!',
      );
    }

    const goal = existingLog?.goal ?? userProfile.dailyStepGoal ?? 8000;

    const upserted = await this.prisma.client.stepLog.upsert({
      where: {
        userId_date: {
          userId,
          date: targetDate,
        },
      },
      create: {
        userId,
        steps: finalSteps,
        goal,
        date: targetDate,
      },
      update: {
        steps: finalSteps,
      },
    });

    return upserted;
  }

  /**
   * "Set Up Camp": Finalizes day's walk, commits steps to cumulative lifetime journey, pitches campsite
   */
  async setUpCamp(userId: string): Promise<SetUpCampResponseDto> {
    const today = this.getNormalizedDate();

    const [userProfile, stepLog] = await Promise.all([
      this.prisma.client.userProfile.findUnique({
        where: { userId },
      }),
      this.prisma.client.stepLog.findUnique({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
      }),
    ]);

    if (!userProfile) {
      throw new NotFoundException('User profile not found');
    }

    if (stepLog?.isCampSet) {
      throw new BadRequestException(
        "Camp has already been pitched for today. Today's steps are locked.",
      );
    }

    const finalStepsToday = stepLog?.steps ?? 0;
    const now = new Date();

    // 1. Lock the day's step record
    const earnedXp = 20; // 20 XP for setting up camp
    await this.prisma.client.stepLog.upsert({
      where: {
        userId_date: {
          userId,
          date: today,
        },
      },
      create: {
        userId,
        steps: finalStepsToday,
        goal: userProfile.dailyStepGoal,
        date: today,
        isCampSet: true,
        campSetAt: now,
        earnedXp,
      },
      update: {
        isCampSet: true,
        campSetAt: now,
        earnedXp: { increment: earnedXp },
      },
    });

    // 2. Add today's steps to user's lifetime journey total & increment campsites
    const updatedProfile = await this.prisma.client.userProfile.update({
      where: { userId },
      data: {
        lifetimeSteps: { increment: finalStepsToday },
        totalCampsites: { increment: 1 },
      },
    });

    // 3. Award Level XP
    await this.leveladdService.addXpToUser(
      userId,
      earnedXp,
      'Camp set ritual completed',
    );

    const unlockedMilestone = getUnlockedExpeditionMilestone(updatedProfile.lifetimeSteps);

    return {
      success: true,
      isCampSet: true,
      campSetAt: now,
      stepsLocked: finalStepsToday,
      lifetimeSteps: updatedProfile.lifetimeSteps,
      totalCampsites: updatedProfile.totalCampsites,
      earnedXp,
      unlockedMilestoneIndex: unlockedMilestone ? unlockedMilestone.index : null,
      unlockedMilestoneName: unlockedMilestone ? unlockedMilestone.name : null,
      message: 'Camp pitched successfully! The campfire is lit under the stars.',
    };
  }

  /**
   * Update personal daily step goal
   */
  async updateStepGoal(userId: string, dto: UpdateStepGoalDto) {
    const updated = await this.prisma.client.userProfile.update({
      where: { userId },
      data: {
        dailyStepGoal: dto.dailyStepGoal,
      },
    });

    return {
      dailyStepGoal: updated.dailyStepGoal,
      message: 'Daily step goal updated successfully',
    };
  }

  /**
   * History of past 30 days of steps and campsites
   */
  async getStepHistory(userId: string, limit: number = 30) {
    const logs = await this.prisma.client.stepLog.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: Math.min(60, Math.max(1, limit)),
    });

    return logs.map((l) => ({
      id: l.id,
      date: l.date,
      steps: l.steps,
      goal: l.goal,
      percentage: l.goal > 0 ? Number(((l.steps / l.goal) * 100).toFixed(1)) : 0,
      isGoalReached: l.steps >= l.goal,
      isCampSet: l.isCampSet,
      campSetAt: l.campSetAt,
      earnedXp: l.earnedXp,
    }));
  }
}

