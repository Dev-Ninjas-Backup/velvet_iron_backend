import { ApiProperty } from '@nestjs/swagger';
import { MealType } from './create-meal-log.dto';

export class MealLogResponseDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'user-uuid' })
    userId: string;

    @ApiProperty({ enum: MealType, example: 'BREAKFAST' })
    mealType: MealType;

    @ApiProperty({ example: 'Oatmeal with banana', nullable: true })
    description: string | null;

    @ApiProperty({ example: 455 })
    calories: number | null;

    @ApiProperty({ example: 50 })
    carbs: number | null;

    @ApiProperty({ example: 30 })
    protein: number | null;

    @ApiProperty({ example: 15 })
    fats: number | null;

    @ApiProperty({ example: '2026-02-14T10:30:00.000Z' })
    loggedAt: Date;
}

export class MealLogHistoryDto {
    @ApiProperty({ type: [MealLogResponseDto] })
    logs: MealLogResponseDto[];

    @ApiProperty({ example: 25 })
    totalCount: number;

    @ApiProperty({
        example: { totalCalories: 2100, totalCarbs: 250, totalProtein: 120, totalFats: 60 },
        description: 'Totals for today',
    })
    todaySummary: {
        totalCalories: number;
        totalCarbs: number;
        totalProtein: number;
        totalFats: number;
    };
}
