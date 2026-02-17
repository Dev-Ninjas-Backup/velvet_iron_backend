import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMealScheduleDto } from './dto/create-meal-schedule.dto';
import { UpdateMealScheduleDto } from './dto/update-meal-schedule.dto';
import {
    MealScheduleResponseDto,
    MealScheduleHistoryDto,
} from './dto/meal-schedule-response.dto';

@Injectable()
export class MealScheduleService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calories = (Carb × 4) + (Protein × 4) + (Fat × 9)
     */
    private calculateCalories(carbs: number, protein: number, fats: number): number {
        return carbs * 4 + protein * 4 + fats * 9;
    }

    async createMealSchedule(
        userId: string,
        dto: CreateMealScheduleDto,
    ): Promise<MealScheduleResponseDto> {
        const calories = this.calculateCalories(
            Number(dto.carbs),
            Number(dto.protein),
            Number(dto.fats),
        );

        const schedule = await this.prisma.client.mealSchedule.create({
            data: {
                userId,
                mealType: dto.mealType,
                scheduledAt: new Date(dto.scheduledAt),
                isTaken: false,
                calories,
                carbs: Number(dto.carbs),
                protein: Number(dto.protein),
                fats: Number(dto.fats),
            },
        });

        return schedule;
    }

    async getMealScheduleHistory(
        userId: string,
        limit: number = 30,
        offset: number = 0,
    ): Promise<MealScheduleHistoryDto> {
        const [schedules, totalCount] = await Promise.all([
            this.prisma.client.mealSchedule.findMany({
                where: { userId },
                orderBy: { scheduledAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.client.mealSchedule.count({ where: { userId } }),
        ]);

        // Today's summary
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todaySchedules = await this.prisma.client.mealSchedule.findMany({
            where: {
                userId,
                scheduledAt: { gte: startOfToday, lte: endOfToday },
            },
        });

        const todaySummary = {
            totalCalories: todaySchedules.reduce((sum, s) => sum + (s.calories || 0), 0),
            totalCarbs: todaySchedules.reduce((sum, s) => sum + (s.carbs || 0), 0),
            totalProtein: todaySchedules.reduce((sum, s) => sum + (s.protein || 0), 0),
            totalFats: todaySchedules.reduce((sum, s) => sum + (s.fats || 0), 0),
        };

        return {
            schedules,
            totalCount,
            todaySummary,
        };
    }

    async getLatestMealSchedule(userId: string): Promise<MealScheduleResponseDto | null> {
        const schedule = await this.prisma.client.mealSchedule.findFirst({
            where: { userId },
            orderBy: { scheduledAt: 'desc' },
        });

        return schedule;
    }

    async updateMealSchedule(
        userId: string,
        scheduleId: string,
        dto: UpdateMealScheduleDto,
    ): Promise<MealScheduleResponseDto> {
        const existing = await this.prisma.client.mealSchedule.findFirst({
            where: { id: scheduleId, userId },
        });

        if (!existing) {
            throw new NotFoundException('Meal schedule not found or does not belong to user');
        }

        const normalizeBooleanValue = (value: unknown): boolean | undefined => {
            if (value === '' || value === undefined || value === null) {
                return undefined;
            }
            if (typeof value === 'string') {
                const normalized = value.trim().toLowerCase();
                if (['true', '1', 'on'].includes(normalized)) return true;
                if (['false', '0', 'off'].includes(normalized)) return false;
                return undefined;
            }
            if (typeof value === 'number') {
                if (value === 1) return true;
                if (value === 0) return false;
            }
            if (value === true || value === false) {
                return value;
            }
            return undefined;
        };

        const normalizedIsTaken = normalizeBooleanValue(dto.isTaken);

        // Recalculate calories if macros changed
        const carbs = dto.carbs !== undefined ? Number(dto.carbs) : existing.carbs;
        const protein = dto.protein !== undefined ? Number(dto.protein) : existing.protein;
        const fats = dto.fats !== undefined ? Number(dto.fats) : existing.fats;
        const calories = this.calculateCalories(carbs ?? 0, protein ?? 0, fats ?? 0);

        const updated = await this.prisma.client.mealSchedule.update({
            where: { id: scheduleId },
            data: {
                ...(dto.mealType && { mealType: dto.mealType }),
                ...(dto.scheduledAt && { scheduledAt: new Date(dto.scheduledAt) }),
                ...(normalizedIsTaken !== undefined && { isTaken: normalizedIsTaken }),
                carbs,
                protein,
                fats,
                calories,
            },
        });

        return updated;
    }

    async deleteMealSchedule(userId: string, scheduleId: string): Promise<void> {
        await this.prisma.client.mealSchedule.deleteMany({
            where: { id: scheduleId, userId },
        });
    }

    async getTodaySchedules(userId: string): Promise<MealScheduleResponseDto[]> {
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const schedules = await this.prisma.client.mealSchedule.findMany({
            where: {
                userId,
                scheduledAt: { gte: startOfToday, lte: endOfToday },
            },
            orderBy: { scheduledAt: 'asc' },
        });

        return schedules;
    }
}
