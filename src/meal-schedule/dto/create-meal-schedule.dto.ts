import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsOptional,
    IsInt,
    IsDateString,
    Min,
} from 'class-validator';
import { MealType } from '../../../prisma/generated/enums';

export { MealType };

export class CreateMealScheduleDto {
    @ApiProperty({
        enum: MealType,
        description: 'Type of meal',
        example: 'BREAKFAST',
    })
    @IsEnum(MealType)
    mealType: MealType;

    @ApiProperty({
        description: 'Scheduled time (ISO 8601)',
        example: '2026-02-14T08:00:00Z',
    })
    @IsDateString()
    scheduledAt: string;

    @ApiProperty({
        description: 'Carbohydrates in grams',
        example: 50,
    })
    @IsInt()
    @Min(0)
    carbs: number;

    @ApiProperty({
        description: 'Protein in grams',
        example: 30,
    })
    @IsInt()
    @Min(0)
    protein: number;

    @ApiProperty({
        description: 'Fats in grams',
        example: 15,
    })
    @IsInt()
    @Min(0)
    fats: number;
}
