import { ApiProperty } from '@nestjs/swagger';
import { MealType } from './create-meal-log.dto';

export class MacroNeedDto {
    @ApiProperty({ example: 2200, nullable: true })
    calories: number | null;

    @ApiProperty({
        example: { protein: 150, fat: 60, carb: 250 },
        nullable: true,
    })
    macroNeed: {
        protein: number | null;
        fat: number | null;
        carb: number | null;
    } | null;
}

export class MacroBreakdownDto {
    @ApiProperty({ example: 120 })
    protein: number;

    @ApiProperty({ example: 45 })
    fat: number;

    @ApiProperty({ example: 180 })
    carb: number;

    @ApiProperty({ example: 1650 })
    calories: number;
}

export class WeeklyPresenceDto {
    @ApiProperty({ example: true })
    sunday: boolean;
    @ApiProperty({ example: true })
    monday: boolean;
    @ApiProperty({ example: true })
    tuesday: boolean;
    @ApiProperty({ example: true })
    wednesday: boolean;
    @ApiProperty({ example: true })
    thursday: boolean;
    @ApiProperty({ example: true })
    friday: boolean;
    @ApiProperty({ example: true })
    saturday: boolean;
}

export class MealLogResponseDto {
    @ApiProperty({ example: 'uuid-string' })
    id: string;

    @ApiProperty({ example: 'user-uuid' })
    userId: string;

    @ApiProperty({ enum: MealType, example: 'BREAKFAST' })
    mealType: MealType;

    @ApiProperty({ example: 'Oatmeal with banana', nullable: true })
    description: string | null;

    @ApiProperty({ example: 455, nullable: true })
    calories: number | null;

    @ApiProperty({ example: 50, nullable: true })
    carbs: number | null;

    @ApiProperty({ example: 30, nullable: true })
    protein: number | null;

    @ApiProperty({ example: 15, nullable: true })
    fats: number | null;

    @ApiProperty({ example: '2026-02-14T10:30:00.000Z' })
    loggedAt: Date;

    @ApiProperty({ example: true })
    isTaken: boolean;

    @ApiProperty({ example: 10 })
    earnedXp: number;
}

export class MealHistoryEntryDto extends MealLogResponseDto {
    @ApiProperty({ example: '2026-02-14T08:00:00.000Z', nullable: true })
    scheduledAt?: Date | null;

    @ApiProperty({ enum: ['LOG', 'SCHEDULE'], example: 'LOG' })
    entryType: 'LOG' | 'SCHEDULE';
}

export class MealLogHistoryDto {
    @ApiProperty({ type: MacroNeedDto, nullable: true })
    daily: MacroNeedDto | null;

    @ApiProperty({ type: MacroBreakdownDto })
    consumed: MacroBreakdownDto;

    @ApiProperty({ type: MacroBreakdownDto })
    remaining: MacroBreakdownDto;

    @ApiProperty({ type: WeeklyPresenceDto })
    weeklyPresent: WeeklyPresenceDto;

    @ApiProperty({ type: [MealHistoryEntryDto] })
    logs: MealHistoryEntryDto[];

    @ApiProperty({ example: 25 })
    totalCount: number;

    @ApiProperty({ example: 250 })
    totalEarnedXp: number;

    @ApiProperty({ type: MealHistoryEntryDto, nullable: true })
    nextSchedule: MealHistoryEntryDto | null;
}
