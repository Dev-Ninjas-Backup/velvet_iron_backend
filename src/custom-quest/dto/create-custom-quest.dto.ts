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

export enum QuestRecurrenceEnum {
  NONE = 'NONE',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  SPECIFIC_DAYS = 'SPECIFIC_DAYS',
  CUSTOM = 'CUSTOM',
}

export class CreateCustomQuestDto {
  @ApiProperty({
    example: 'Morning Walk & Sunlight',
    description: 'Name/title of the custom quest',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'FITNESS',
    description: 'Category: FITNESS, NUTRITION, MINDFULNESS, GENERAL, etc.',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiPropertyOptional({
    example: '15 minute walk outside after waking up',
    description: 'Optional notes or instructions',
  })
  @IsString()
  @IsOptional()
  description?: string;

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

  @ApiProperty({
    enum: QuestRecurrenceEnum,
    example: QuestRecurrenceEnum.DAILY,
    description: 'Recurrence rule for the quest',
  })
  @IsEnum(QuestRecurrenceEnum)
  @IsNotEmpty()
  recurrence: QuestRecurrenceEnum;

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

  @ApiPropertyOptional({
    example: 10,
    description: 'XP reward (capped at max 15 XP)',
  })
  @IsInt()
  @Min(0)
  @Max(15)
  @IsOptional()
  xp?: number;
}

