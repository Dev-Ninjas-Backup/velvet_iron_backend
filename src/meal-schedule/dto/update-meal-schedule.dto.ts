import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsOptional,
    IsInt,
    IsDateString,
    Min,
} from 'class-validator';
import { MealType } from '../../../prisma/generated/enums';

export class UpdateMealScheduleDto {
    @IsEnum(MealType)
    @IsOptional()
    mealType?: MealType;

    @IsDateString()
    @IsOptional()
    scheduledAt?: string;

    @IsInt()
    @Min(0)
    @IsOptional()
    carbs?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    protein?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    fats?: number;
}
