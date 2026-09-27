import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { ScheduleItemDto, ScheduleListResponseDto, CreateScheduleResponseDto } from './dto/schedule-response.dto';

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: Normalize date to start of day UTC
   */
  private normalizeDate(dateStr?: string): Date {
    const d = dateStr ? new Date(dateStr) : new Date();
    d.setUTCHours(0, 0, 0, 0);
    return d;
  }

  /**
   * Helper: Map Prisma ScheduleItem to response DTO
   */
  private mapToDto(item: any): ScheduleItemDto {
    return {
      id: item.id,
      userId: item.userId,
      itemType: item.itemType,
      title: item.title,
      description: item.description ?? null,
      recurrenceType: item.recurrenceType,
      daysOfWeek: item.daysOfWeek || [],
      timeOfDay: item.timeOfDay ?? null,
      isPaused: item.isPaused,
      startDate: item.startDate ? new Date(item.startDate).toISOString().split('T')[0] : '',
      endDate: item.endDate ? new Date(item.endDate).toISOString().split('T')[0] : null,
      metadata: item.metadata ?? undefined,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  /**
   * Create a recurring schedule item (medication, workout, etc.)
   */
  async create(userId: string, dto: CreateScheduleDto): Promise<CreateScheduleResponseDto> {
    const startDate = dto.startDate ? this.normalizeDate(dto.startDate) : this.normalizeDate();
    const endDate = dto.endDate ? this.normalizeDate(dto.endDate) : null;

    const created = await (this.prisma.client as any).scheduleItem.create({
      data: {
        userId,
        itemType: dto.itemType || 'WORKOUT',
        title: dto.title,
        description: dto.description,
        recurrenceType: dto.recurrenceType,
        daysOfWeek: dto.daysOfWeek || [],
        timeOfDay: dto.timeOfDay,
        isPaused: dto.isPaused ?? false,
        startDate,
        endDate,
        metadata: dto.metadata || undefined,
      },
    });

    return {
      success: true,
      data: this.mapToDto(created),
    };
  }

  /**
   * Fetch schedules, expanding recurring items for the requested date (YYYY-MM-DD)
   */
  async findAll(userId: string, dateStr?: string): Promise<ScheduleListResponseDto> {
    if (!dateStr) {
      const allItems = await (this.prisma.client as any).scheduleItem.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      const mapped = allItems.map((item: any) => this.mapToDto(item));
      return {
        success: true,
        data: mapped,
        total: mapped.length,
      };
    }

    const targetDate = this.normalizeDate(dateStr);
    // ISO 8601 day of week: 1 = Monday ... 7 = Sunday
    const jsDay = targetDate.getUTCDay();
    const isoDay = jsDay === 0 ? 7 : jsDay;

    const candidateSchedules = await (this.prisma.client as any).scheduleItem.findMany({
      where: {
        userId,
        startDate: {
          lte: targetDate,
        },
        OR: [
          { endDate: null },
          { endDate: { gte: targetDate } },
        ],
      },
      orderBy: [{ timeOfDay: 'asc' }, { createdAt: 'desc' }],
    });

    const activeForDate = candidateSchedules.filter((schedule: any) => {
      if (schedule.recurrenceType === 'NONE') {
        const itemStart = new Date(schedule.startDate);
        itemStart.setUTCHours(0, 0, 0, 0);
        return itemStart.getTime() === targetDate.getTime();
      }

      if (schedule.recurrenceType === 'DAILY') {
        return true;
      }

      if (
        schedule.recurrenceType === 'WEEKLY' ||
        schedule.recurrenceType === 'SPECIFIC_DAYS'
      ) {
        return (
          Array.isArray(schedule.daysOfWeek) &&
          schedule.daysOfWeek.includes(isoDay)
        );
      }

      return false;
    });

    const mapped = activeForDate.map((item: any) => this.mapToDto(item));
    return {
      success: true,
      data: mapped,
      date: dateStr,
      total: mapped.length,
    };
  }

  /**
   * Find a single schedule item by ID
   */
  async findOne(userId: string, id: string): Promise<ScheduleItemDto> {
    const item = await (this.prisma.client as any).scheduleItem.findFirst({
      where: { id, userId },
    });

    if (!item) {
      throw new NotFoundException(`Schedule item with ID "${id}" not found.`);
    }

    return this.mapToDto(item);
  }

  /**
   * Update an existing schedule item
   */
  async update(userId: string, id: string, dto: UpdateScheduleDto): Promise<ScheduleItemDto> {
    await this.findOne(userId, id);

    const updated = await (this.prisma.client as any).scheduleItem.update({
      where: { id },
      data: {
        ...(dto.itemType && { itemType: dto.itemType }),
        ...(dto.title && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.recurrenceType && { recurrenceType: dto.recurrenceType }),
        ...(dto.daysOfWeek && { daysOfWeek: dto.daysOfWeek }),
        ...(dto.timeOfDay !== undefined && { timeOfDay: dto.timeOfDay }),
        ...(dto.isPaused !== undefined && { isPaused: dto.isPaused }),
        ...(dto.startDate && { startDate: this.normalizeDate(dto.startDate) }),
        ...(dto.endDate !== undefined && {
          endDate: dto.endDate ? this.normalizeDate(dto.endDate) : null,
        }),
        ...(dto.metadata !== undefined && { metadata: dto.metadata }),
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Delete or remove a schedule item
   */
  async remove(userId: string, id: string): Promise<{ success: boolean; message: string }> {
    await this.findOne(userId, id);

    await (this.prisma.client as any).scheduleItem.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Schedule item removed successfully.',
    };
  }
}
