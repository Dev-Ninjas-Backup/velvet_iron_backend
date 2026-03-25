import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
    IsEnum,
    IsOptional,
    IsInt,
    IsDateString,
    Min,
    IsBoolean,
} from 'class-validator';
import { MealType } from '../../../prisma/generated/enums';

export class UpdateMealScheduleDto {
    @IsEnum(MealType)
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsOptional()
    mealType?: MealType;

    @IsDateString()
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsOptional()
    scheduledAt?: string;

    @IsInt()
    @Min(0)
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsOptional()
    carbs?: number;

    @IsInt()
    @Min(0)
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsOptional()
    protein?: number;

    @IsInt()
    @Min(0)
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsOptional()
    fats?: number;

    @IsBoolean()
    @Transform(({ value }) => {
        if (value === '' || value === undefined || value === null) {
            return undefined;
        }
        if (typeof value === 'string') {
            const normalized = value.trim().toLowerCase();
            if (['true', '1', 'on'].includes(normalized)) return true;
            if (['false', '0', 'off'].includes(normalized)) return false;
            return undefined;
        }
        if (typeof value === 'number') {
            if (value === 1) return true;
            if (value === 0) return false;
        }
        if (value === true || value === false) {
            return value;
        }
        return undefined;
    })
    @IsOptional()
    isTaken?: boolean;
}
