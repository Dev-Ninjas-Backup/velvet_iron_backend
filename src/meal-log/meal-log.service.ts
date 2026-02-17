import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMealLogDto } from './dto/create-meal-log.dto';
import { UpdateMealLogDto } from './dto/update-meal-log.dto';
import {
    MealLogResponseDto,
    MealLogHistoryDto,
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
    ) {
        const [logs, totalCount] = await Promise.all([
            this.prisma.client.mealLog.findMany({
                where: { userId },
                orderBy: { loggedAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            this.prisma.client.mealLog.count({ where: { userId } }),
        ]);

        // Today's consumed macros
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const todayLogs = await this.prisma.client.mealLog.findMany({
            where: {
                userId,
                loggedAt: { gte: startOfToday, lte: endOfToday },
            },
        });

        console.log("9999999999", todayLogs, userId);


        const consumed = {
            protein: todayLogs.reduce((sum, l) => sum + (l.protein || 0), 0),
            fat: todayLogs.reduce((sum, l) => sum + (l.fats || 0), 0),
            carb: todayLogs.reduce((sum, l) => sum + (l.carbs || 0), 0),
            calories: todayLogs.reduce((sum, l) => sum + (l.calories || 0), 0),
        };

        // Daily need from latest weight
        const latestMacroGoal = await this.prisma.client.macroGoal.findFirst({
            where: { userId },
            orderBy: {
                createdAt: 'desc'
            }
        });

        let daily = null;
        let remaining = null;

        daily = {
            calories: latestMacroGoal ? latestMacroGoal.calories : null,
            macroNeed: {
                protein: latestMacroGoal ? latestMacroGoal.protein : null,
                fat: latestMacroGoal ? latestMacroGoal.fat : null,
                carb: latestMacroGoal ? latestMacroGoal.carbs : null,
            },
        };
        //remaining dont show minus that is show 0 if user over consume
        remaining = {
            protein: Math.max(0, (latestMacroGoal ? latestMacroGoal.protein : 0) - consumed.protein),
            fat: Math.max(0, (latestMacroGoal ? latestMacroGoal.fat : 0) - consumed.fat),
            carb: Math.max(0, (latestMacroGoal ? latestMacroGoal.carbs : 0) - consumed.carb), // issue not whoeing
            calories: Math.max(0, (latestMacroGoal ? latestMacroGoal.calories : 0) - consumed.calories),
        };
        // if (latestMacroGoal) {
        //     // const weightLbs = parseFloat(latestMacroGoal.weight);

        //     if (!isNaN(weightLbs) && weightLbs > 0) {
        //         const weight = weightLbs * 0.453592; // lbs to kg
        //         const calories = Math.round(weight * 35);
        //         const proteinNeed = Math.round(weight * 1.5);
        //         const fatNeed = Math.round(weight * 0.8);
        //         const carbNeed = Math.round((calories - (proteinNeed * 4 + fatNeed * 9)) / 4);

        //     }
        // }

        // Weekly presence: which days this week user logged meals
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weekLogs = await this.prisma.client.mealLog.findMany({
            where: {
                userId,
                loggedAt: { gte: startOfWeek, lte: endOfWeek },
            },
            select: { loggedAt: true },
        });

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

        return {
            daily,
            consumed,
            remaining,
            weeklyPresent,
            logs,
            totalCount,
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

        console.log("ddddddddddddddd",dto);
        

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
