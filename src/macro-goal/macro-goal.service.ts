import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../lib/prisma/prisma.service';
import { CreateMacroGoalDto } from './dto/create-macro-goal.dto';
import { UpdateMacroGoalDto } from './dto/update-macro-goal.dto';

@Injectable()
export class MacroGoalService {
    constructor(private readonly prisma: PrismaService) { }

    /**
     * Calculate calories from macronutrients
     * Calories = (Carbs × 4) + (Fat × 9) + (Protein × 4)
     */
    private calculateCalories(carbs: number, fat: number, protein: number): number {
        return carbs * 4 + fat * 9 + protein * 4;
    }

    /**
     * Create a new macro goal
     */
    async createMacroGoal(userId: string, dto: CreateMacroGoalDto) {
        const calories = this.calculateCalories(dto.carbs, dto.fat, dto.protein);
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const existingToday = await this.prisma.client.macroGoal.findFirst({
            where: {
                userId,
                createdAt: {
                    gte: todayStart,
                    lte: todayEnd,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        if (existingToday) {
            return this.prisma.client.macroGoal.update({
                where: { id: existingToday.id },
                data: {
                    name: dto.name,
                    carbs: dto.carbs,
                    fat: dto.fat,
                    protein: dto.protein,
                    calories,
                },
            });
        }

        return this.prisma.client.macroGoal.create({
            data: {
                userId,
                name: dto.name,
                carbs: dto.carbs,
                fat: dto.fat,
                protein: dto.protein,
                calories,
            },
        });
    }

    /**
     * Get all macro goals for a user
     */
    async getAllMacroGoals(userId: string) {
        const macroGoals = await this.prisma.client.macroGoal.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        if (!macroGoals || macroGoals.length === 0) {
            return [];
        }

        return macroGoals;
    }

    /**
     * Get a specific macro goal by ID
     */
    async getMacroGoalById(userId: string, id: string) {
        const macroGoal = await this.prisma.client.macroGoal.findFirst({
            where: { id, userId },
        });

        if (!macroGoal) {
            throw new NotFoundException('Macro goal not found');
        }

        return macroGoal;
    }

    /**
     * Update a macro goal
     */
    async updateMacroGoal(userId: string, id: string, dto: UpdateMacroGoalDto) {
        const macroGoal = await this.getMacroGoalById(userId, id);

        const carbs = dto.carbs !== undefined ? dto.carbs : macroGoal.carbs;
        const fat = dto.fat !== undefined ? dto.fat : macroGoal.fat;
        const protein = dto.protein !== undefined ? dto.protein : macroGoal.protein;

        const calories = this.calculateCalories(carbs, fat, protein);

        const updatedMacroGoal = await this.prisma.client.macroGoal.update({
            where: { id },
            data: {
                name: dto.name !== undefined ? dto.name : macroGoal.name,
                carbs,
                fat,
                protein,
                calories,
            },
        });

        return updatedMacroGoal;
    }

    /**
     * Delete a macro goal
     */
    async deleteMacroGoal(userId: string, id: string) {
        const macroGoal = await this.getMacroGoalById(userId, id);

        await this.prisma.client.macroGoal.delete({
            where: { id },
        });

        return { message: 'Macro goal deleted successfully', id };
    }
}
