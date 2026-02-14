import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsOptional,
    IsString,
    IsInt,
    IsDateString,
    Min,
} from 'class-validator';
import { MealType } from '../../../prisma/generated/enums';

export { MealType };

export class CreateMealLogDto {
    @ApiProperty({
        enum: MealType,
        description: 'Type of meal',
        example: 'BREAKFAST',
    })
    @IsEnum(MealType)
    mealType: MealType;

    @ApiProperty({
        description: 'Meal description',
        example: 'Oatmeal with banana',
        required: false,
    })
    @IsString()
    @IsOptional()
    description?: string;

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

    @ApiProperty({
        description: 'Log timestamp (ISO 8601)',
        example: '2026-02-14T10:30:00Z',
        required: false,
    })
    @IsDateString()
    @IsOptional()
    loggedAt?: string;
}
