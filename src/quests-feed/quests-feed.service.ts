import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { XpStatsService } from '../xp-stats/xp-stats.service';
import { CustomQuestService } from '../custom-quest/custom-quest.service';
import { SchedulesService } from '../schedules/schedules.service';
import { LeveladdService } from '../leveladd/leveladd.service';
import { ExerciseLogService } from '../exercise-log/exercise-log.service';
import { MedicationScheduleService } from '../medication-schedule/medication-schedule.service';
import { UnifiedQuestItemDto, QuestType } from './dto/quests-feed-response.dto';
import { CompleteQuestDto } from './dto/complete-quest.dto';
import { getUserDayBoundaries, formatDateInTimezone } from '../common/utils/timezone.util';

@Injectable()
export class QuestsFeedService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly xpStatsService: XpStatsService,
    private readonly customQuestService: CustomQuestService,
    private readonly schedulesService: SchedulesService,
    private readonly leveladdService: LeveladdService,
    private readonly exerciseLogService: ExerciseLogService,
    private readonly medicationScheduleService: MedicationScheduleService,
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
    const customData = await this.customQuestService.findAll(userId, todayStr, timezone);
    const customQuests: UnifiedQuestItemDto[] = customData.data.map((q: any) => ({
      id: `custom_${q.id}`,
      title: q.name || q.title,
      description: q.description,
      xpReward: q.xpReward || q.xp,
      isCompleted: Boolean(
        q.isCompleted ||
        (q.lastCompletedAt &&
          new Date(q.lastCompletedAt) >= targetDate &&
          new Date(q.lastCompletedAt) <= endOfDay)
      ),
      questType: QuestType.CUSTOM,
      originalRefId: q.id,
    }));

    // 3. Fetch Scheduled Exercises & Medications
    const [todayExercises, todayMedsResult, schedulesData] = await Promise.all([
      this.exerciseLogService.getTodaySchedules(userId, timezone, todayStr).catch(() => []),
      this.medicationScheduleService.getTodaySchedules(userId, timezone, todayStr).catch(() => ({ totalToday: 0, schedules: [] })),
      this.schedulesService.findAll(userId, todayStr).catch(() => ({ success: true, data: [] })),
    ]);

    const scheduledQuests: UnifiedQuestItemDto[] = [];
    const addedIds = new Set<string>();

    for (const e of todayExercises) {
      scheduledQuests.push({
        id: `workout_${e.id}`,
        title: e.name,
        description: `${e.type || 'WORKOUT'}${e.duration ? ` • ${e.duration} min` : ''}`,
        xpReward: 10,
        isCompleted: Boolean(e.isTaken),
        questType: QuestType.WORKOUT_SCHEDULE,
        originalRefId: e.id,
        scheduledAt: e.loggedAt ? new Date(e.loggedAt).toISOString() : undefined,
      });
      addedIds.add(e.id);
      addedIds.add(e.name.toLowerCase());
    }

    for (const m of (todayMedsResult.schedules || [])) {
      scheduledQuests.push({
        id: `med_${m.id}`,
        title: m.name,
        description: `${m.type || 'Medication'}${m.doseMg ? ` • ${m.doseMg}mg` : ''}`,
        xpReward: 10,
        isCompleted: Boolean(m.isTaken),
        questType: QuestType.MEDICATION_SCHEDULE,
        originalRefId: m.id,
        scheduledAt: m.scheduleTime ? new Date(m.scheduleTime).toISOString() : undefined,
      });
      addedIds.add(m.id);
      addedIds.add(m.name.toLowerCase());
    }

    // For unified schedule items, avoid duplicates
    const scheduleIds = (schedulesData.data || [])
      .filter((s: any) => !addedIds.has(s.id) && !addedIds.has(s.title?.toLowerCase()))
      .map((s: any) => s.id);

    if (scheduleIds.length > 0) {
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

      for (const s of (schedulesData.data || [])) {
        if (addedIds.has(s.id) || addedIds.has(s.title?.toLowerCase())) continue;

        let description = s.description;
        let scheduledAtIso: string | undefined = undefined;

        if (s.timeOfDay) {
          const [hours, minutes] = s.timeOfDay.split(':').map(Number);
          if (!isNaN(hours) && !isNaN(minutes)) {
            const dateWithTime = new Date(targetDate.getTime() + (hours * 60 + minutes) * 60 * 1000);
            scheduledAtIso = dateWithTime.toISOString();

            if (s.itemType === 'WORKOUT') {
              const formattedTime = formatDateInTimezone(dateWithTime, timezone);
              const workoutType = s.metadata?.type || s.metadata?.exerciseType || 'WORKOUT';
              const duration = s.metadata?.duration || 30;
              description = `${String(workoutType).toUpperCase()} • ${duration} min • ${formattedTime}`;
            }
          }
        }

        if (!description) {
          description = s.itemType === 'MEDICATION' ? 'Time for your medication' : 'Scheduled workout';
        }

        scheduledQuests.push({
          id: `${s.itemType.toLowerCase()}_${s.id}`,
          title: s.title,
          description,
          xpReward: 10,
          isCompleted: completedScheduleIds.has(s.id),
          questType: s.itemType === 'MEDICATION' ? QuestType.MEDICATION_SCHEDULE : QuestType.WORKOUT_SCHEDULE,
          originalRefId: s.id,
          scheduledAt: scheduledAtIso,
          timeOfDay: s.timeOfDay ?? undefined,
        });
      }
    }

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

  async completeQuest(userId: string, dto: CompleteQuestDto, timezone?: string, targetDate?: string) {
    const targetDateStr = targetDate || dto.dateStr;
    let originalId = dto.questId;
    if (originalId.includes('_')) {
      originalId = originalId.substring(originalId.indexOf('_') + 1);
    }

    let questType = dto.questType;
    if (!questType) {
      if (dto.questId.startsWith('custom_')) {
        questType = QuestType.CUSTOM;
      } else if (dto.questId.startsWith('med_')) {
        questType = QuestType.MEDICATION_SCHEDULE;
      } else if (dto.questId.startsWith('workout_')) {
        questType = QuestType.WORKOUT_SCHEDULE;
      } else if (dto.questId.startsWith('codex_')) {
        questType = QuestType.CODEX;
      } else {
        const isCustom = await (this.prisma.client as any).customQuest.findFirst({
          where: { id: originalId, userId },
        });
        questType = isCustom ? QuestType.CUSTOM : QuestType.MEDICATION_SCHEDULE;
      }
    }

    if (questType === QuestType.CODEX) {
      throw new BadRequestException('Codex quests cannot be completed manually. Log the required activity instead.');
    }

    if (questType === QuestType.CUSTOM) {
      return this.customQuestService.complete(userId, originalId, timezone);
    }

    // Check if matching exerciseScheduleLog exists
    const exerciseSchedule = await this.prisma.client.exerciseScheduleLog.findFirst({
      where: { id: originalId, userId },
    });

    if (exerciseSchedule) {
      await this.exerciseLogService.markExerciseLogAsTaken(userId, originalId, true, timezone, targetDateStr);
      const userProfile = await this.prisma.client.userProfile.findUnique({ where: { userId } });
      return {
        success: true,
        data: {
          id: dto.questId,
          isCompleted: true,
          xpAwarded: 10,
          companionTotalXp: userProfile?.totalEarnXp ?? 0,
          companionLevel: userProfile?.level ?? 1,
        },
      };
    }

    // Check if matching medicationSchedule exists
    const medSchedule = await this.prisma.client.medicationSchedule.findFirst({
      where: { id: originalId, userId },
    });

    if (medSchedule) {
      await this.medicationScheduleService.markMedicationAsTaken(userId, originalId, true, timezone, targetDateStr);
      const userProfile = await this.prisma.client.userProfile.findUnique({ where: { userId } });
      return {
        success: true,
        data: {
          id: dto.questId,
          isCompleted: true,
          xpAwarded: 10,
          companionTotalXp: userProfile?.totalEarnXp ?? 0,
          companionLevel: userProfile?.level ?? 1,
        },
      };
    }

    // Handle unified scheduleItem
    const scheduleItem = await (this.prisma.client as any).scheduleItem.findFirst({
      where: { id: originalId, userId },
    });

    if (!scheduleItem) {
      throw new NotFoundException('Scheduled item not found');
    }

    const now = new Date();
    const { startOfDay: todayStart, endOfDay: todayEnd } = getUserDayBoundaries(timezone, targetDateStr);

    const existingLog = await (this.prisma.client as any).scheduleCompletionLog.findFirst({
      where: {
        userId,
        scheduleItemId: originalId,
        completedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    if (existingLog) {
      return {
        success: true,
        message: 'Already completed today',
        xpAwarded: 0,
      };
    }

    await (this.prisma.client as any).scheduleCompletionLog.create({
      data: {
        userId,
        scheduleItemId: originalId,
        completedAt: now,
      },
    });

    // Synchronize underlying legacy schedule tables (ExerciseScheduleLog / MedicationSchedule)
    if (scheduleItem.itemType === 'WORKOUT') {
      await (this.prisma.client as any).exerciseScheduleLog.updateMany({
        where: {
          userId,
          OR: [
            { id: originalId },
            { name: scheduleItem.title },
          ],
        },
        data: {
          isTaken: true,
          lastTakenDate: now,
        },
      }).catch(() => {});
    } else if (scheduleItem.itemType === 'MEDICATION') {
      await (this.prisma.client as any).medicationSchedule.updateMany({
        where: {
          userId,
          OR: [
            { id: originalId },
            { name: scheduleItem.title },
          ],
        },
        data: {
          isTaken: true,
          lastTakenDate: now,
        },
      }).catch(() => {});
    }

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
      },
    };
  }
}
