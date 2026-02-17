import { ApiProperty } from '@nestjs/swagger';
import { MealType } from './create-meal-schedule.dto';

export class MealScheduleResponseDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'user-uuid' })
    userId: string;

    @ApiProperty({ enum: MealType, example: 'BREAKFAST' })
    mealType: MealType;

    @ApiProperty({ example: '2026-02-14T08:00:00.000Z' })
    scheduledAt: Date;

    @ApiProperty({ example: true, required: false })
    isTaken?: boolean | null;

    @ApiProperty({ example: 455 })
    calories: number | null;

    @ApiProperty({ example: 50 })
    carbs: number | null;

    @ApiProperty({ example: 30 })
    protein: number | null;

    @ApiProperty({ example: 15 })
    fats: number | null;
}

export class MealScheduleHistoryDto {
    @ApiProperty({ type: [MealScheduleResponseDto] })
    schedules: MealScheduleResponseDto[];

    @ApiProperty({ example: 10 })
    totalCount: number;

    @ApiProperty({
        example: { totalCalories: 2100, totalCarbs: 250, totalProtein: 120, totalFats: 60 },
        description: 'Totals for today\'s scheduled meals',
    })
    todaySummary: {
        totalCalories: number;
        totalCarbs: number;
        totalProtein: number;
        totalFats: number;
    };
}
