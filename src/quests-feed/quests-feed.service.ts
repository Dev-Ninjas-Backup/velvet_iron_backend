import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { XpStatsService } from '../xp-stats/xp-stats.service';
import { CustomQuestService } from '../custom-quest/custom-quest.service';
import { SchedulesService } from '../schedules/schedules.service';
import { LeveladdService } from '../leveladd/leveladd.service';
import { UnifiedQuestItemDto, QuestType } from './dto/quests-feed-response.dto';
import { CompleteQuestDto } from './dto/complete-quest.dto';
import { getUserDayBoundaries } from '../common/utils/timezone.util';

@Injectable()
export class QuestsFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpStatsService: XpStatsService,
    private readonly customQuestService: CustomQuestService,
    private readonly schedulesService: SchedulesService,
    private readonly leveladdService: LeveladdService,
  ) {}

  async getTodaysQuests(userId: string, dateStr?: string, timezone?: string) {
    const { startOfDay: targetDate, endOfDay, dateStr: resolvedDateStr } =
      getUserDayBoundaries(timezone, dateStr);
    const todayStr = resolvedDateStr;

    // 1. Fetch Codex Quests (System)
    const xpStats = await this.xpStatsService.getTodayQuestXp(userId, timezone, todayStr);
    const codexQuests: UnifiedQuestItemDto[] = xpStats.quests.map((q) => ({
      id: `codex_${q.id}`,
      title: q.title,
      description: q.description,
      xpReward: q.xp,
      isCompleted: Boolean(q.isDone),
      questType: QuestType.CODEX,
      originalRefId: q.id,
    }));

    // 2. Fetch Custom Quests
    const customData = await this.customQuestService.findAll(userId, todayStr);
    const customQuests: UnifiedQuestItemDto[] = customData.data.map((q: any) => ({
      id: `custom_${q.id}`,
      title: q.name || q.title,
      description: q.description,
      xpReward: q.xpReward || q.xp,
      isCompleted: q.isCompleted || (q.lastCompletedAt && new Date(q.lastCompletedAt) >= targetDate && new Date(q.lastCompletedAt) <= endOfDay),
      questType: QuestType.CUSTOM,
      originalRefId: q.id,
    }));

    // 3. Fetch Scheduled Items (Medications & Workouts)
    const schedulesData = await this.schedulesService.findAll(userId, todayStr);
    
    // For scheduled items, we need to check the ScheduleCompletionLog for today
    const scheduleIds = schedulesData.data.map((s: any) => s.id);
    const completions = await (this.prisma.client as any).scheduleCompletionLog.findMany({
      where: {
        userId,
        scheduleItemId: { in: scheduleIds },
        completedAt: {
          gte: targetDate,
          lte: endOfDay,
        },
      },
    });
    
    const completedScheduleIds = new Set(completions.map((c: any) => c.scheduleItemId));

    const scheduledQuests: UnifiedQuestItemDto[] = schedulesData.data.map((s: any) => ({
      id: `${s.itemType.toLowerCase()}_${s.id}`,
      title: s.title || s.name,
      description: s.description || (s.itemType === 'MEDICATION' ? 'Time for your medication' : 'Scheduled workout'),
      xpReward: 10, // Standard schedule completion XP
      isCompleted: completedScheduleIds.has(s.id),
      questType: s.itemType === 'MEDICATION' ? QuestType.MEDICATION_SCHEDULE : QuestType.WORKOUT_SCHEDULE,
      originalRefId: s.id,
    }));

    // Combine all
    const allQuests = [...codexQuests, ...customQuests, ...scheduledQuests];

    return {
      success: true,
      data: allQuests,
      meta: {
        totalQuests: allQuests.length,
        completedQuests: allQuests.filter(q => q.isCompleted).length,
        todayCustomXpEarned: customData.meta?.todayCustomXpEarned || 0,
        dailyCustomXpCap: customData.meta?.dailyCustomXpCap || 50,
      }
    };
  }

  async completeQuest(userId: string, dto: CompleteQuestDto) {
    if (dto.questType === QuestType.CODEX) {
      throw new BadRequestException('Codex quests cannot be completed manually. Log the required activity instead.');
    }

    // Strip prefix if the client sent the unified ID (e.g. "custom_123" -> "123")
    let originalId = dto.questId;
    if (originalId.includes('_')) {
      originalId = originalId.substring(originalId.indexOf('_') + 1);
    }

    if (dto.questType === QuestType.CUSTOM) {
      return this.customQuestService.complete(userId, originalId);
    }

    // Handle Schedules (MEDICATION or WORKOUT)
    const scheduleItem = await (this.prisma.client as any).scheduleItem.findFirst({
      where: { id: originalId, userId }
    });

    if (!scheduleItem) {
      throw new NotFoundException('Scheduled item not found');
    }

    // Check if already completed today
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const existingLog = await (this.prisma.client as any).scheduleCompletionLog.findFirst({
      where: {
        userId,
        scheduleItemId: originalId,
        completedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      }
    });

    if (existingLog) {
      return {
        success: true,
        message: 'Already completed today',
        xpAwarded: 0
      };
    }

    // Mark as completed
    await (this.prisma.client as any).scheduleCompletionLog.create({
      data: {
        userId,
        scheduleItemId: originalId,
        completedAt: now,
      }
    });

    // Award XP
    const xpAwarded = 10;
    await this.leveladdService.addXpToUser(userId, xpAwarded, `SCHEDULED_ITEM: ${scheduleItem.title}`);

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    return {
      success: true,
      data: {
        id: dto.questId,
        isCompleted: true,
        xpAwarded,
        companionTotalXp: userProfile?.totalEarnXp ?? 0,
        companionLevel: userProfile?.level ?? 1,
      }
    };
  }
}
