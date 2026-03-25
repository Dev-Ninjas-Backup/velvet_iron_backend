import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsOptional,
    IsString,
    IsInt,
    IsDateString,
    Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
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
    @Transform(({ value }) => {
        console.log("value",value);
        
        return(value === '' ? undefined : value)
    })
    @Type(() => Number)
    carbs?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @Type(() => Number)
    protein?: number;

    @IsInt()
    @Min(0)
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @Type(() => Number)
    fats?: number;

    @IsDateString()
    @IsOptional()
    @Transform(({ value }) => (value === '' ? undefined : value))
    loggedAt?: string;
}
