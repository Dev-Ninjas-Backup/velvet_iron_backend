import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { LeveladdService } from '../leveladd/leveladd.service';
import { CreateCustomQuestDto } from './dto/create-custom-quest.dto';
import { UpdateCustomQuestDto } from './dto/update-custom-quest.dto';
import {
  CustomQuestResponseDto,
  CompleteCustomQuestResponseDto,
} from './dto/custom-quest-response.dto';

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
      name: quest.name,
      category: quest.category,
      description: quest.description ?? undefined,
      scheduledDate: quest.scheduledDate
        ? new Date(quest.scheduledDate).toISOString().split('T')[0]
        : undefined,
      scheduledTime: quest.scheduledTime ?? undefined,
      recurrence: quest.recurrence,
      daysOfWeek: quest.daysOfWeek && quest.daysOfWeek.length > 0 ? quest.daysOfWeek : undefined,
      reminderEnabled: quest.reminderEnabled,
      reminderTime: quest.reminderTime ?? undefined,
      isDone,
      isPaused: quest.isPaused,
      xp: quest.xp,
      isCustom: true,
      createdAt: quest.createdAt,
      updatedAt: quest.updatedAt,
    };
  }

  /**
   * Create a new custom quest with anti-abuse XP capping (max 15 XP).
   */
  async create(userId: string, dto: CreateCustomQuestDto): Promise<CustomQuestResponseDto> {
    const cappedXp = Math.min(Math.max(dto.xp ?? 10, 0), 15);

    const quest = await (this.prisma.client as any).customQuest.create({
      data: {
        userId,
        name: dto.name,
        category: dto.category,
        description: dto.description,
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
        scheduledTime: dto.scheduledTime,
        recurrence: dto.recurrence || 'NONE',
        daysOfWeek: dto.daysOfWeek || [],
        reminderEnabled: dto.reminderEnabled ?? false,
        reminderTime: dto.reminderTime,
        xp: cappedXp,
      },
    });

    return this.mapToDto(quest);
  }

  /**
   * Fetch user's custom quests, optionally filtered for a specific target date.
   */
  async findAll(userId: string, dateStr?: string): Promise<{ success: boolean; quests: CustomQuestResponseDto[] }> {
    const targetDate = dateStr ? new Date(dateStr) : new Date();
    const dayOfWeek = targetDate.getDay() === 0 ? 7 : targetDate.getDay(); // 1 = Monday ... 7 = Sunday

    const targetStart = new Date(targetDate);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

    const allQuests = await (this.prisma.client as any).customQuest.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

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

    return {
      success: true,
      quests: filtered.map((q: any) => this.mapToDto(q, targetDate)),
    };
  }

  /**
   * Find a specific custom quest by ID.
   */
  async findOne(userId: string, id: string): Promise<CustomQuestResponseDto> {
    const quest = await (this.prisma.client as any).customQuest.findFirst({
      where: { id, userId },
    });
    if (!quest) throw new NotFoundException('Custom quest not found');
    return this.mapToDto(quest);
  }

  /**
   * Update custom quest fields.
   */
  async update(userId: string, id: string, dto: UpdateCustomQuestDto): Promise<CustomQuestResponseDto> {
    await this.findOne(userId, id);

    const cappedXp = dto.xp !== undefined ? Math.min(Math.max(dto.xp, 0), 15) : undefined;

    const updated = await (this.prisma.client as any).customQuest.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.category && { category: dto.category }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.scheduledDate && { scheduledDate: new Date(dto.scheduledDate) }),
        ...(dto.scheduledTime !== undefined && { scheduledTime: dto.scheduledTime }),
        ...(dto.recurrence && { recurrence: dto.recurrence }),
        ...(dto.daysOfWeek && { daysOfWeek: dto.daysOfWeek }),
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
    await this.findOne(userId, id);
    const updated = await (this.prisma.client as any).customQuest.update({
      where: { id },
      data: { isPaused },
    });
    return { success: true, isPaused: updated.isPaused };
  }

  /**
   * Delete custom quest.
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(userId, id);
    await (this.prisma.client as any).customQuest.delete({
      where: { id },
    });
    return { success: true, message: 'Quest deleted successfully' };
  }

  /**
   * Complete custom quest and award capped XP.
   */
  async complete(userId: string, id: string): Promise<CompleteCustomQuestResponseDto> {
    const quest = await (this.prisma.client as any).customQuest.findFirst({
      where: { id, userId },
    });
    if (!quest) throw new NotFoundException('Custom quest not found');

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const alreadyCompletedToday = Boolean(
      quest.lastCompletedAt &&
        new Date(quest.lastCompletedAt) >= todayStart &&
        new Date(quest.lastCompletedAt) <= todayEnd,
    );

    let earnedXp = 0;

    if (!alreadyCompletedToday) {
      // Check daily cap: maximum 5 custom quest completions per calendar day
      const todayCompletions = await (this.prisma.client as any).customQuest.count({
        where: {
          userId,
          lastCompletedAt: {
            gte: todayStart,
            lte: todayEnd,
          },
        },
      });

      if (todayCompletions < 5) {
        earnedXp = quest.xp;
        await this.leveladd.addXpToUser(userId, earnedXp, `Custom Quest: ${quest.name}`);
      }
    }

    const updated = await (this.prisma.client as any).customQuest.update({
      where: { id },
      data: { lastCompletedAt: new Date() },
    });

    const userProfile = await this.prisma.client.userProfile.findUnique({
      where: { userId },
    });

    return {
      success: true,
      quest: {
        ...this.mapToDto(updated),
        isDone: true,
      },
      earnedXp,
      newBalanceXp: userProfile?.balanceXp ?? 0,
    };
  }
}

