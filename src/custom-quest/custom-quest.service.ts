import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { LeveladdService } from '../leveladd/leveladd.service';
import { CreateCustomQuestDto } from './dto/create-custom-quest.dto';
import { UpdateCustomQuestDto } from './dto/update-custom-quest.dto';
import {
  CustomQuestResponseDto,
  CustomQuestCreateResponseDto,
  CustomQuestListResponseDto,
  CompleteCustomQuestResponseDto,
} from './dto/custom-quest-response.dto';
import { XP_REWARDS } from '../common/constants/xp.constants';
import { getUserDayBoundaries } from '../common/utils/timezone.util';

const DAILY_CUSTOM_XP_CAP = XP_REWARDS.CUSTOM_QUEST.DAILY_TOTAL_CAP;

@Injectable()
export class CustomQuestService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly leveladd: LeveladdService,
  ) {}

  /**
   * Helper to format a quest entity into the public response DTO.
   */
  private mapToDto(quest: any, targetDate: Date = new Date()): CustomQuestResponseDto {
    const targetStart = new Date(targetDate);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

    const isDone = Boolean(
      quest.lastCompletedAt &&
        new Date(quest.lastCompletedAt) >= targetStart &&
        new Date(quest.lastCompletedAt) <= targetEnd,
    );

    return {
      id: quest.id,
      userId: quest.userId,
      title: quest.name,
      name: quest.name,
      category: quest.category,
      description: quest.description ?? undefined,
      scheduledDate: quest.scheduledDate
        ? new Date(quest.scheduledDate).toISOString().split('T')[0]
        : undefined,
      scheduledTime: quest.scheduledTime ?? undefined,
      frequency: quest.recurrence,
      recurrence: quest.recurrence,
      daysOfWeek: quest.daysOfWeek && quest.daysOfWeek.length > 0 ? quest.daysOfWeek : undefined,
      reminderEnabled: quest.reminderEnabled,
      reminderTime: quest.reminderTime ?? undefined,
      isCompleted: isDone,
      isDone,
      completedAt: quest.lastCompletedAt ?? null,
      isPaused: quest.isPaused,
      xpReward: quest.xp,
      xp: quest.xp,
      isCustom: true,
      createdAt: quest.createdAt,
      updatedAt: quest.updatedAt,
    };
  }

  /**
   * Helper to calculate total XP earned from custom quests within a specific date window.
   */
  private async getCustomXpEarnedOnDate(userId: string, start: Date, end: Date): Promise<number> {
    const logs = await this.prisma.client.xpLog.findMany({
      where: {
        userId,
        createdAt: {
          gte: start,
          lte: end,
        },
        OR: [
          { source: { startsWith: 'CUSTOM_QUEST' } },
          { source: { startsWith: 'Custom Quest' } },
        ],
      },
    });

    return logs.reduce((sum, log) => sum + (log.amount || 0), 0);
  }

  /**
   * Create a new custom quest with anti-abuse XP capping (max 15 XP).
   */
  async create(userId: string, dto: CreateCustomQuestDto): Promise<CustomQuestCreateResponseDto> {
    const questTitle = (dto.title || dto.name || '').trim();
    if (!questTitle || questTitle.length < 3) {
      throw new BadRequestException('Quest title must be at least 3 characters long.');
    }
    if (questTitle.length > 60) {
      throw new BadRequestException('Quest title cannot exceed 60 characters.');
    }

    const inputXp = dto.xpReward ?? dto.xp ?? XP_REWARDS.CUSTOM_QUEST.DEFAULT_XP;
    const parsedXp = Number(inputXp);
    const rawXp = !isNaN(parsedXp) ? parsedXp : XP_REWARDS.CUSTOM_QUEST.DEFAULT_XP;
    const cappedXp = Math.min(
      Math.max(rawXp, XP_REWARDS.CUSTOM_QUEST.MIN_XP),
      XP_REWARDS.CUSTOM_QUEST.MAX_XP,
    );
    const frequency = (dto.frequency || dto.recurrence || 'DAILY').toUpperCase();

    const quest = await (this.prisma.client as any).customQuest.create({
      data: {
        userId,
        name: questTitle,
        category: dto.category || 'GENERAL',
        description: dto.description,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        scheduledTime: dto.scheduledTime,
        recurrence: frequency,
        daysOfWeek: dto.daysOfWeek || dto.repeatDays || [],
        reminderEnabled: dto.reminderEnabled ?? false,
        reminderTime: dto.reminderTime,
        xp: cappedXp,
      },
    });

    const mapped = this.mapToDto(quest);
    return {
      success: true,
      data: mapped,
    };
  }

  /**
   * Normalizes custom quest ID by stripping any 'custom_' prefix or unified prefix.
   */
  normalizeId(id: string): string {
    if (!id || typeof id !== 'string') return id;
    const trimmed = id.trim();
    if (trimmed.startsWith('custom_')) {
      return trimmed.slice(7);
    }
    if (trimmed.includes('_')) {
      return trimmed.substring(trimmed.indexOf('_') + 1);
    }
    return trimmed;
  }

  /**
   * Fetch user's custom quests, optionally filtered for a specific target date and user timezone.
   */
  async findAll(userId: string, dateStr?: string, timezone?: string): Promise<CustomQuestListResponseDto> {
    const { startOfDay: targetStart, endOfDay: targetEnd, dateStr: resolvedDateStr } =
      getUserDayBoundaries(timezone, dateStr);
    const [y, m, d] = resolvedDateStr.split('-').map(Number);
    const tempRef = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    const dayName = new Intl.DateTimeFormat('en-US', { timeZone: timezone || 'UTC', weekday: 'short' }).format(tempRef);
    const dayMap: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };
    const dayOfWeek = dayMap[dayName] ?? 1;

    const [allQuests, todayCustomXpEarned] = await Promise.all([
      (this.prisma.client as any).customQuest.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      this.getCustomXpEarnedOnDate(userId, targetStart, targetEnd),
    ]);

    const filtered = allQuests.filter((quest: any) => {
      // If paused, exclude unless completed on this day
      if (quest.isPaused) {
        const wasDoneToday =
          quest.lastCompletedAt &&
          new Date(quest.lastCompletedAt) >= targetStart &&
          new Date(quest.lastCompletedAt) <= targetEnd;
        if (!wasDoneToday) return false;
      }

      if (quest.recurrence === 'DAILY') return true;
      if (quest.recurrence === 'WEEKLY' || quest.recurrence === 'SPECIFIC_DAYS') {
        return Array.isArray(quest.daysOfWeek) && quest.daysOfWeek.includes(dayOfWeek);
      }
      if (quest.scheduledDate) {
        const questDate = new Date(quest.scheduledDate);
        return questDate >= targetStart && questDate <= targetEnd;
      }
      return true;
    });

    const mapped = filtered.map((q: any) => this.mapToDto(q, targetStart));

    return {
      success: true,
      data: mapped,
      quests: mapped,
      meta: {
        todayCustomXpEarned,
        dailyCustomXpCap: DAILY_CUSTOM_XP_CAP,
      },
    };
  }

  /**
   * Find a specific custom quest by ID.
   */
  async findOne(userId: string, id: string): Promise<CustomQuestResponseDto> {
    const normalizedId = this.normalizeId(id);
    const quest = await (this.prisma.client as any).customQuest.findFirst({
      where: { id: normalizedId, userId },
    });
    if (!quest) throw new NotFoundException('Custom quest not found');
    return this.mapToDto(quest);
  }

  /**
   * Update custom quest fields.
   */
  async update(userId: string, id: string, dto: UpdateCustomQuestDto): Promise<CustomQuestResponseDto> {
    const normalizedId = this.normalizeId(id);
    await this.findOne(userId, normalizedId);

    const inputXp = dto.xpReward !== undefined ? dto.xpReward : dto.xp;
    const rawXp = inputXp !== undefined ? Number(inputXp) : undefined;
    const cappedXp =
      rawXp !== undefined && !isNaN(rawXp)
        ? Math.min(
            Math.max(rawXp, XP_REWARDS.CUSTOM_QUEST.MIN_XP),
            XP_REWARDS.CUSTOM_QUEST.MAX_XP,
          )
        : undefined;
    const questName = dto.name;

    const updated = await (this.prisma.client as any).customQuest.update({
      where: { id: normalizedId },
      data: {
        ...(questName && { name: questName }),
        ...(dto.category && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.scheduledDate && { scheduledDate: new Date(dto.scheduledDate) }),
        ...(dto.scheduledTime !== undefined && { scheduledTime: dto.scheduledTime }),
        ...(dto.recurrence && { recurrence: dto.recurrence }),
        ...((dto.daysOfWeek !== undefined || dto.repeatDays !== undefined) && {
          daysOfWeek: dto.daysOfWeek || dto.repeatDays || [],
        }),
        ...(dto.reminderEnabled !== undefined && { reminderEnabled: dto.reminderEnabled }),
        ...(dto.reminderTime !== undefined && { reminderTime: dto.reminderTime }),
        ...(dto.isPaused !== undefined && { isPaused: dto.isPaused }),
        ...(cappedXp !== undefined && { xp: cappedXp }),
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Toggle paused state of custom quest.
   */
  async pause(userId: string, id: string, isPaused: boolean): Promise<{ success: boolean; isPaused: boolean }> {
    const normalizedId = this.normalizeId(id);
    await this.findOne(userId, normalizedId);
    const updated = await (this.prisma.client as any).customQuest.update({
      where: { id: normalizedId },
      data: { isPaused },
    });
    return { success: true, isPaused: updated.isPaused };
  }

  /**
   * Delete custom quest.
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    const normalizedId = this.normalizeId(id);
    await this.findOne(userId, normalizedId);
    await (this.prisma.client as any).customQuest.delete({
      where: { id: normalizedId },
    });
    return { success: true, message: 'Custom quest deleted successfully.' };
  }

  /**
   * Complete custom quest and award capped XP (subject to 50 XP/day anti-abuse cap).
   */
  async complete(
    userId: string,
    id: string,
    timezone?: string,
  ): Promise<CompleteCustomQuestResponseDto> {
    const normalizedId = this.normalizeId(id);
    const quest = await (this.prisma.client as any).customQuest.findFirst({
      where: { id: normalizedId, userId },
    });
    if (!quest) throw new NotFoundException('Custom quest not found');

    const now = new Date();
    const { startOfDay: todayStart, endOfDay: todayEnd } = getUserDayBoundaries(timezone);

    const alreadyCompletedToday = Boolean(
      quest.lastCompletedAt &&
        new Date(quest.lastCompletedAt) >= todayStart &&
        new Date(quest.lastCompletedAt) <= todayEnd,
    );

    // Anti-Abuse: Calculate remaining daily custom XP allowance up to 50 XP
    const todayCustomXpEarned = await this.getCustomXpEarnedOnDate(userId, todayStart, todayEnd);
    const remainingCap = Math.max(0, DAILY_CUSTOM_XP_CAP - todayCustomXpEarned);

    let xpAwarded = 0;
    if (!alreadyCompletedToday && remainingCap > 0) {
      xpAwarded = Math.min(quest.xp, remainingCap);
      if (xpAwarded > 0) {
        await this.leveladd.addXpToUser(userId, xpAwarded, `CUSTOM_QUEST: ${quest.name}`);
      }
    }

    // Always record completion date even if 0 XP was awarded due to cap
    const updated = await (this.prisma.client as any).customQuest.update({
      where: { id: normalizedId },
      data: { lastCompletedAt: now },
    });

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    const mapped = {
      ...this.mapToDto(updated),
      isDone: true,
      isCompleted: true,
    };

    return {
      success: true,
      data: {
        id: quest.id,
        isCompleted: true,
        xpAwarded,
        companionTotalXp: userProfile?.totalEarnXp ?? 0,
        companionLevel: userProfile?.level ?? 1,
      },
      quest: mapped,
      earnedXp: xpAwarded,
      newBalanceXp: userProfile?.balanceXp ?? 0,
    };
  }
}
