import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsDateString,
} from 'class-validator';

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
}

export class UpdateExerciseScheduleDto {
  @ApiProperty({
    description: 'Type of exercise',
    enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
    required: false,
    example: 'STRENGTH',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Name of the exercise',
    required: false,
    example: 'Push-ups',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Intensity level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
    example: 'HIGH',
  })
  @IsOptional()
  @IsString()
  intensity?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    required: false,
    example: 45,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
    example: 'Evening workout',
  })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty({
    description: 'Scheduled time for exercise',
    required: false,
    example: '2026-02-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  scheduledAt?: string;
}
