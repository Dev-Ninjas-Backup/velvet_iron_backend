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

export class UpdateMealLogDto {
    @IsEnum(MealType)
    @IsOptional()
    mealType?: MealType;

    @IsString()
    @IsOptional()
    description?: string;

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

    @IsDateString()
    @IsOptional()
    loggedAt?: string;
}
