import { Injectable } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import {
  COMPANION_DIALOGUE_MATRIX,
  DialogueTriggerContext,
  CompanionDialogueEntry,
} from './constants/companion-dialogue-matrix.constants';
import { CompanionDialogueResponseDto } from './dto/companion-dialogue.dto';

@Injectable()
export class CompanionDialogueService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Normalizes companion name to key slug
   */
  private normalizeCompanionKey(name?: string | null): string {
    const normalized = (name || '').toLowerCase().trim();
    if (normalized.includes('thyra')) return 'thyra';
    if (normalized.includes('leon')) return 'leon';
    if (normalized.includes('visepheron')) return 'visepheron';
    return 'riven'; // Default starter companion
  }

  /**
   * Evaluates user activity state to determine the highest-priority trigger context
   */
  async evaluateContext(userId: string): Promise<{
    context: DialogueTriggerContext;
    metaActionPrompt?: string;
  }> {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const [recentWorkout, recentMeal, todayLogsCount, latestLogBeforeToday, pendingSchedules] =
      await Promise.all([
        // 1. Check if workout logged in last 30 minutes
        this.prisma.client.exerciseLog.findFirst({
          where: {
            userId,
            loggedAt: { gte: thirtyMinutesAgo },
          },
          orderBy: { loggedAt: 'desc' },
        }),

        // 2. Check if meal logged in last 30 minutes
        this.prisma.client.mealLog.findFirst({
          where: {
            userId,
            loggedAt: { gte: thirtyMinutesAgo },
          },
          orderBy: { loggedAt: 'desc' },
        }),

        // 3. Check logs count today across meal, exercise, mood
        Promise.all([
          this.prisma.client.mealLog.count({
            where: { userId, loggedAt: { gte: startOfToday } },
          }),
          this.prisma.client.exerciseLog.count({
            where: { userId, loggedAt: { gte: startOfToday } },
          }),
          this.prisma.client.moodLog.count({
            where: { userId, loggedAt: { gte: startOfToday } },
          }),
        ]).then(([m, e, mo]) => m + e + mo),

        // 4. Last activity before today to check inactivity
        this.prisma.client.exerciseLog.findFirst({
          where: { userId, loggedAt: { lt: startOfToday } },
          orderBy: { loggedAt: 'desc' },
        }),

        // 5. Check pending schedule due today
        this.prisma.client.exerciseScheduleLog.findFirst({
          where: {
            userId,
            isTaken: false,
            isPaused: false,
          },
        }),
      ]);

    // Priority 1: Inactivity Re-engagement (no activity in 3+ days)
    if (
      todayLogsCount === 0 &&
      latestLogBeforeToday &&
      new Date(latestLogBeforeToday.loggedAt) < threeDaysAgo
    ) {
      return { context: DialogueTriggerContext.REENGAGEMENT };
    }

    // Priority 2: Immediate Post-Workout Reaction (logged in last 30 mins)
    if (recentWorkout) {
      return { context: DialogueTriggerContext.POST_WORKOUT };
    }

    // Priority 3: Immediate Post-Meal Reaction (logged in last 30 mins)
    if (recentMeal) {
      return { context: DialogueTriggerContext.POST_MEAL };
    }

    // Priority 4: Streak at Risk (Night time >= 20:00 and 0 activities logged today)
    const currentHour = now.getHours();
    if (currentHour >= 20 && todayLogsCount === 0) {
      return { context: DialogueTriggerContext.STREAK_AT_RISK };
    }

    // Priority 5: Pending Schedule
    if (pendingSchedules && todayLogsCount === 0) {
      return { context: DialogueTriggerContext.PENDING_SCHEDULE };
    }

    // Priority 6: Natural Time of Day
    if (currentHour >= 5 && currentHour < 12) {
      return { context: DialogueTriggerContext.MORNING };
    } else if (currentHour >= 12 && currentHour < 17) {
      return { context: DialogueTriggerContext.AFTERNOON };
    } else if (currentHour >= 17 && currentHour < 21) {
      return { context: DialogueTriggerContext.EVENING };
    } else {
      return { context: DialogueTriggerContext.NIGHT };
    }
  }

  /**
   * Retrieves situational companion dialogue for the requesting user
   */
  async getSituationalDialogue(userId: string): Promise<CompanionDialogueResponseDto> {
    // 1. Fetch user's active companion from UserProfile
    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
      include: {
        activeCompanion: true,
      },
    });

    let activeCompanion = userProfile?.activeCompanion;

    // Fallback: If no companion active, find starter companion (Riven)
    if (!activeCompanion) {
      activeCompanion = await this.prisma.client.companion.findFirst({
        where: { name: { contains: 'Riven', mode: 'insensitive' } },
      });
    }

    const companionKey = this.normalizeCompanionKey(activeCompanion?.name);
    const companionData = COMPANION_DIALOGUE_MATRIX[companionKey] || COMPANION_DIALOGUE_MATRIX['riven'];

    // 2. Evaluate context
    const { context } = await this.evaluateContext(userId);

    // 3. Resolve dialogue entry (with anti-repetition rotation based on current minute)
    const candidates: CompanionDialogueEntry[] =
      companionData[context] ??
      companionData[DialogueTriggerContext.MORNING] ??
      [{ text: activeCompanion?.quote || 'Come now. We have things to accomplish.' }];

    const minuteIndex = Math.floor(Date.now() / 60000);
    const selected = candidates[minuteIndex % candidates.length];

    return {
      companion: {
        id: activeCompanion?.id || 'default-companion',
        name: activeCompanion?.name || 'Riven',
        slug: companionKey,
        title: activeCompanion?.title ?? 'High Lord of the Forsaken Court',
        quote: activeCompanion?.quote ?? 'Come now. We have things to accomplish.',
      },
      triggerContext: context,
      text: selected.text,
      actionPrompt: selected.actionPrompt,
      timestamp: new Date().toISOString(),
    };
  }
}
