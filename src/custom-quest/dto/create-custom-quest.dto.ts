import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsArray,
  IsInt,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';

export enum QuestRecurrenceEnum {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  SPECIFIC_DAYS = 'SPECIFIC_DAYS',
  CUSTOM = 'CUSTOM',
}

export class CreateCustomQuestDto {
  @ApiPropertyOptional({
    example: 'Evening Stretch',
    description: 'Title of the custom quest (min 3, max 60 chars)',
  })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({
    example: 'Morning Walk & Sunlight',
    description: 'Legacy name/title alias of the custom quest',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    example: '10 minutes of hip and back mobility',
    description: 'Optional notes or instructions',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'FITNESS',
    description: 'Category: FITNESS, NUTRITION, MINDFULNESS, GENERAL, etc.',
    default: 'GENERAL',
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    example: 15,
    description: 'XP reward (between 5 and 15, auto-clamped)',
  })
  @IsInt()
  @IsOptional()
  xpReward?: number;

  @ApiPropertyOptional({
    example: 10,
    description: 'Legacy XP field (capped at max 15 XP)',
  })
  @IsInt()
  @IsOptional()
  xp?: number;

  @ApiPropertyOptional({
    enum: QuestRecurrenceEnum,
    example: QuestRecurrenceEnum.DAILY,
    description: 'Frequency of the quest: DAILY or WEEKLY',
    default: 'DAILY',
  })
  @IsOptional()
  frequency?: string;

  @ApiPropertyOptional({
    enum: QuestRecurrenceEnum,
    example: QuestRecurrenceEnum.DAILY,
    description: 'Legacy recurrence rule for the quest',
  })
  @IsEnum(QuestRecurrenceEnum)
  @IsOptional()
  recurrence?: QuestRecurrenceEnum;

  @ApiPropertyOptional({
    example: '2026-09-18',
    description: 'Target date (YYYY-MM-DD)',
  })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiPropertyOptional({
    example: '08:00',
    description: 'Scheduled time of day (HH:mm)',
  })
  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @ApiPropertyOptional({
    example: [1, 2, 3, 4, 5],
    type: [Number],
    description: 'Days of week (1 = Monday ... 7 = Sunday) if recurring',
  })
  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  daysOfWeek?: number[];

  @ApiPropertyOptional({
    example: true,
    description: 'Whether reminder notification is enabled',
  })
  @IsBoolean()
  @IsOptional()
  reminderEnabled?: boolean;

  @ApiPropertyOptional({
    example: '07:45',
    description: 'Reminder time or offset',
  })
  @IsString()
  @IsOptional()
  reminderTime?: string;
}
