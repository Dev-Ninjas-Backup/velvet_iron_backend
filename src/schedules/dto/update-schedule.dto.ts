import { ApiPropertyOptional } from '@nestjs/swagger';
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
import { ScheduleItemTypeEnum, ScheduleRecurrenceTypeEnum } from './create-schedule.dto';

export class UpdateScheduleDto {
  @ApiPropertyOptional({ enum: ScheduleItemTypeEnum })
  @IsEnum(ScheduleItemTypeEnum)
  @IsOptional()
  itemType?: ScheduleItemTypeEnum;

  @ApiPropertyOptional({ example: 'Updated Schedule Title' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ enum: ScheduleRecurrenceTypeEnum })
  @IsEnum(ScheduleRecurrenceTypeEnum)
  @IsOptional()
  recurrenceType?: ScheduleRecurrenceTypeEnum;

  @ApiPropertyOptional({ example: [1, 3, 5], type: [Number] })
  @IsArray()
  @IsInt({ each: true })
  @Min(1, { each: true })
  @Max(7, { each: true })
  @IsOptional()
  daysOfWeek?: number[];

  @ApiPropertyOptional({ example: '09:00' })
  @IsString()
  @IsOptional()
  timeOfDay?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPaused?: boolean;

  @ApiPropertyOptional({ example: '2026-09-24' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  @IsDateString()
  @IsOptional()
  endDate?: string | null;

  @ApiPropertyOptional({ example: { intensity: 'HIGH' } })
  @IsOptional()
  metadata?: Record<string, any>;
}
