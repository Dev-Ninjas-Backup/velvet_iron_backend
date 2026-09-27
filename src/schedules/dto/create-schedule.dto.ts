import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export enum ScheduleItemTypeEnum {
  MEDICATION = 'MEDICATION',
  WORKOUT = 'WORKOUT',
  MEAL = 'MEAL',
  GENERAL = 'GENERAL',
}

export enum ScheduleRecurrenceTypeEnum {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  SPECIFIC_DAYS = 'SPECIFIC_DAYS',
}

export class CreateScheduleDto {
  @ApiProperty({
    enum: ScheduleItemTypeEnum,
    example: ScheduleItemTypeEnum.WORKOUT,
    description: 'Type of schedule item: WORKOUT, MEDICATION, MEAL, GENERAL',
    default: ScheduleItemTypeEnum.WORKOUT,
  })
  @IsEnum(ScheduleItemTypeEnum)
  @IsOptional()
  itemType?: ScheduleItemTypeEnum;

  @ApiProperty({
    example: 'Morning Mobility & Cardio',
    description: 'Title of the scheduled activity or medication',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    example: '30-minute steady state cardio and hip stretches',
    description: 'Optional description or notes',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    enum: ScheduleRecurrenceTypeEnum,
    example: ScheduleRecurrenceTypeEnum.DAILY,
    description: 'Recurrence frequency: NONE, DAILY, WEEKLY, SPECIFIC_DAYS',
  })
  @IsEnum(ScheduleRecurrenceTypeEnum)
  @IsNotEmpty()
  recurrenceType: ScheduleRecurrenceTypeEnum;

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    type: [Number],
    description: 'ISO 8601 days of week (1 = Monday ... 7 = Sunday)',
  })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  @IsOptional()
  daysOfWeek?: number[];

  @ApiPropertyOptional({
    example: '08:30',
    description: 'Reminder or scheduled time of day (HH:mm)',
  })
  @IsString()
  @IsOptional()
  timeOfDay?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Whether the schedule is currently paused',
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isPaused?: boolean;

  @ApiPropertyOptional({
    example: '2026-09-24',
    description: 'Start date of recurring schedule (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: null,
    nullable: true,
    description: 'Optional end date of recurring schedule (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @ApiPropertyOptional({
    example: { intensity: 'MEDIUM', duration: 30, doseMg: 500 },
    description: 'Optional metadata payload for workouts or medications',
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
