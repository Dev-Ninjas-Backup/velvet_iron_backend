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

import { normalizeDaysOfWeek } from '../../common/utils/weekday.util';

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

    @ApiProperty({
        description: 'Recurrence type (DAILY, SPECIFIC_DAYS, ONCE)',
        required: false,
        example: 'DAILY',
    })
    @Transform(({ value }) => (value === '' ? undefined : value))
    @IsOptional()
    recurrence?: string;

    @ApiProperty({
        description: 'Days of week for SPECIFIC_DAYS recurrence (1=Mon ... 7=Sun)',
        required: false,
        type: [Number],
        example: [1, 2, 3, 4, 5],
    })
    @Transform(({ value, obj }) => normalizeDaysOfWeek(value, obj))
    @IsOptional()
    daysOfWeek?: number[];

    @ApiProperty({
        description: 'Alias for daysOfWeek: [1, 3, 5] or ["MONDAY", "WEDNESDAY", "FRIDAY"]',
        required: false,
        example: [1, 3, 5],
    })
    @IsOptional()
    repeatDays?: any;

    @ApiProperty({
        description: 'Whether recurrence is paused',
        required: false,
        example: false,
    })
    @Transform(({ value }) => {
        if (value === '' || value === undefined || value === null) return undefined;
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
        if (value === true || value === false) return value;
        return undefined;
    })
    @IsOptional()
    @IsBoolean()
    isPaused?: boolean;
}
