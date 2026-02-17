import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
import {
    MealLogResponseDto,
    MealLogHistoryDto,
    MealHistoryEntryDto,
} from './dto/meal-log-response.dto';

@Injectable()
export class MealLogService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calories = (Carb × 4) + (Protein × 4) + (Fat × 9)
     */
    private calculateCalories(carbs: number, protein: number, fats: number): number {
        return carbs * 4 + protein * 4 + fats * 9;
    }

    async createMealLog(
        userId: string,
        dto: CreateMealLogDto,
    ): Promise<MealLogResponseDto> {
        const calories = this.calculateCalories(
            Number(dto.carbs),
            Number(dto.protein),
            Number(dto.fats),
        );

        const mealLog = await this.prisma.client.mealLog.create({
            data: {
                userId,
                mealType: dto.mealType,
                description: dto.description,
                calories,
                carbs: Number(dto.carbs),
                protein: Number(dto.protein),
                fats: Number(dto.fats),
                loggedAt: dto.loggedAt ? new Date(dto.loggedAt) : new Date(),
            },
        });

        return mealLog;
    }

    async getMealLogHistory(
        userId: string,
        limit: number = 30,
        offset: number = 0,
    ): Promise<MealLogHistoryDto> {
        const normalizedLimit = Math.max(0, limit ?? 30);
        const normalizedOffset = Math.max(0, offset ?? 0);

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const now = new Date();
        const dayOfWeek = now.getDay();
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const [
            mealLogs,
            mealSchedules,
            todayLogs,
            latestMacroGoal,
            weekLogs,
        ] = await Promise.all([
            this.prisma.client.mealLog.findMany({
                where: { userId },
                orderBy: { loggedAt: 'desc' },
            }),
            this.prisma.client.mealSchedule.findMany({
                where: { userId },
                orderBy: { scheduledAt: 'desc' },
            }),
            this.prisma.client.mealLog.findMany({
                where: {
                    userId,
                    loggedAt: { gte: startOfToday, lte: endOfToday },
                },
            }),
            this.prisma.client.macroGoal.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.mealLog.findMany({
                where: {
                    userId,
                    loggedAt: { gte: startOfWeek, lte: endOfWeek },
                },
                select: { loggedAt: true },
            }),
        ]);

        const consumed = {
            protein: todayLogs.reduce((sum, l) => sum + (l.protein || 0), 0),
            fat: todayLogs.reduce((sum, l) => sum + (l.fats || 0), 0),
            carb: todayLogs.reduce((sum, l) => sum + (l.carbs || 0), 0),
            calories: todayLogs.reduce((sum, l) => sum + (l.calories || 0), 0),
        };

        const daily = {
            calories: latestMacroGoal ? latestMacroGoal.calories : null,
            macroNeed: {
                protein: latestMacroGoal ? latestMacroGoal.protein : null,
                fat: latestMacroGoal ? latestMacroGoal.fat : null,
                carb: latestMacroGoal ? latestMacroGoal.carbs : null,
            },
        };

        const macroTargets = {
            protein: latestMacroGoal?.protein ?? 0,
            fat: latestMacroGoal?.fat ?? 0,
            carb: latestMacroGoal?.carbs ?? 0,
            calories: latestMacroGoal?.calories ?? 0,
        };

        const remaining = {
            protein: Math.max(0, macroTargets.protein - consumed.protein),
            fat: Math.max(0, macroTargets.fat - consumed.fat),
            carb: Math.max(0, macroTargets.carb - consumed.carb),
            calories: Math.max(0, macroTargets.calories - consumed.calories),
        };

        const loggedDays = new Set(
            weekLogs.map((l) => l.loggedAt.getDay()),
        );

        const weeklyPresent = {
            sunday: loggedDays.has(0),
            monday: loggedDays.has(1),
            tuesday: loggedDays.has(2),
            wednesday: loggedDays.has(3),
            thursday: loggedDays.has(4),
            friday: loggedDays.has(5),
            saturday: loggedDays.has(6),
        };

        const combinedHistory: MealHistoryEntryDto[] = [
            ...mealLogs.map<MealHistoryEntryDto>((log) => ({
                id: log.id,
                userId: log.userId,
                mealType: log.mealType,
                description: log.description ?? null,
                calories: log.calories ?? null,
                carbs: log.carbs ?? null,
                protein: log.protein ?? null,
                fats: log.fats ?? null,
                loggedAt: log.loggedAt,
                isTaken: log.isTaken ?? true,
                earnedXp: log.earnedXp ?? 0,
                scheduledAt: null,
                entryType: 'LOG',
            })),
            ...mealSchedules.map<MealHistoryEntryDto>((schedule) => ({
                id: schedule.id,
                userId: schedule.userId,
                mealType: schedule.mealType,
                description: null,
                calories: schedule.calories ?? null,
                carbs: schedule.carbs ?? null,
                protein: schedule.protein ?? null,
                fats: schedule.fats ?? null,
                loggedAt: schedule.scheduledAt,
                isTaken: schedule.isTaken ?? false,
                earnedXp: schedule.earnedXp ?? 0,
                scheduledAt: schedule.scheduledAt,
                entryType: 'SCHEDULE',
            })),
        ];

        combinedHistory.sort((a, b) => {
            if (a.isTaken === b.isTaken) {
                return b.loggedAt.getTime() - a.loggedAt.getTime();
            }
            return a.isTaken ? 1 : -1;
        });

        const totalCount = combinedHistory.length;
        const paginatedHistory = normalizedLimit === 0
            ? []
            : combinedHistory.slice(
                normalizedOffset,
                normalizedOffset + normalizedLimit,
            );

        const totalEarnedXp = combinedHistory
            .filter((entry) => entry.isTaken)
            .reduce((sum, entry) => sum + (entry.earnedXp ?? 0), 0);

        const nextSchedule =
            combinedHistory.find(
                (entry) => entry.entryType === 'SCHEDULE' && !entry.isTaken,
            ) ?? null;

        return {
            daily,
            consumed,
            remaining,
            weeklyPresent,
            logs: paginatedHistory,
            totalCount,
            totalEarnedXp,
            nextSchedule,
        };
    }

    async getLatestMealLog(userId: string): Promise<MealLogResponseDto | null> {
        const log = await this.prisma.client.mealLog.findFirst({
            where: { userId },
            orderBy: { loggedAt: 'desc' },
        });

        return log;
    }

    async updateMealLog(
        userId: string,
        logId: string,
        dto: UpdateMealLogDto,
    ): Promise<MealLogResponseDto> {
        // 1️⃣ Fetch existing log
        const existingLog = await this.prisma.client.mealLog.findFirst({
            where: { id: logId, userId },
        });

        if (!existingLog) {
            throw new NotFoundException('Meal log not found or does not belong to user');
        }

        // 2️⃣ Use updated macros if provided, else fallback
        const carbs = dto.carbs ?? existingLog.carbs;
        const protein = dto.protein ?? existingLog.protein;
        const fats = dto.fats ?? existingLog.fats;

        console.log("ddddddddddddddd", dto);


        // 3️⃣ Recalculate calories
        const calories = this.calculateCalories(
            carbs ?? 0,
            protein ?? 0,
            fats ?? 0,
        );


        // 4️⃣ Update the log
        const updatedLog = await this.prisma.client.mealLog.update({
            where: { id: logId },
            data: {
                // only update if provided
                ...(dto.mealType !== undefined && { mealType: dto.mealType }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.carbs !== undefined && { carbs }),
                ...(dto.protein !== undefined && { protein }),
                ...(dto.fats !== undefined && { fats }),
                calories,
                ...(dto.loggedAt !== undefined && { loggedAt: new Date(dto.loggedAt) }),
            },
        });

        return updatedLog;
    }


    async deleteMealLog(userId: string, logId: string): Promise<void> {
        await this.prisma.client.mealLog.deleteMany({
            where: { id: logId, userId },
        });
    }
}
