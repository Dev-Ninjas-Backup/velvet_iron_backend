import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateExerciseScheduleDto {
  @ApiProperty({
    description: 'Type of exercise',
    enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
    example: 'CARDIO',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Name of the exercise',
    example: 'Running',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Intensity level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
    example: 'MEDIUM',
  })
  @IsOptional()
  @IsString()
  intensity?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Morning run',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Scheduled time for exercise',
    example: '2026-02-15T08:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduledAt: string;

  @ApiProperty({
    description: 'Whether the exercise was done',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isTaken?: boolean;
}

export class UpdateExerciseScheduleDto {
  @ApiProperty({
    description: 'Type of exercise',
    enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
    required: false,
    example: 'STRENGTH',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Name of the exercise',
    required: false,
    example: 'Push-ups',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Intensity level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
    example: 'HIGH',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  intensity?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    required: false,
    example: 45,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
    example: 'Evening workout',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Scheduled time for exercise',
    required: false,
    example: '2026-02-15T08:00:00Z',
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;

  @ApiProperty({
    description: 'Whether the exercise was done',
    required: false,
    example: true,
  })
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
  @IsBoolean()
  isTaken?: boolean;
}
