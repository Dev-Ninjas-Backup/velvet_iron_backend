import { ApiProperty } from '@nestjs/swagger';
import {
    IsEnum,
    IsOptional,
    IsInt,
    IsDateString,
    Min,
    IsBoolean,
} from 'class-validator';
import { MealType } from '../../../prisma/generated/enums';
import { Transform } from 'class-transformer';
import { normalizeDaysOfWeek } from '../../common/utils/weekday.util';

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

    @ApiProperty({
        description: 'Whether the meal was taken',
        required: false,
        example: true,
    })
    @IsOptional()
    @IsBoolean()
    isTaken?: boolean;

    @ApiProperty({
        description: 'Recurrence type (DAILY, SPECIFIC_DAYS, ONCE)',
        required: false,
        example: 'DAILY',
        default: 'DAILY',
    })
    @IsOptional()
    recurrence?: string;

    @ApiProperty({
        description: 'Days of week for SPECIFIC_DAYS recurrence (1=Mon ... 7=Sun, or ["MONDAY", "WEDNESDAY"])',
        required: false,
        type: [Number],
        example: [1, 3, 5],
    })
    @Transform(({ value, obj }) => normalizeDaysOfWeek(value, obj))
    @IsOptional()
    @IsInt({ each: true })
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
        default: false,
    })
    @IsOptional()
    @IsBoolean()
    isPaused?: boolean;
}
