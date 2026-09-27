import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsOptional, IsPositive, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateStepsDto {
  @ApiProperty({
    description: 'Set absolute step count for the day (e.g. 6842)',
    required: false,
    example: 6842,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Type(() => Number)
  steps?: number;

  @ApiProperty({
    description: 'Increment current step count by this amount (e.g. +1500)',
    required: false,
    example: 1500,
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Type(() => Number)
  addSteps?: number;

  @ApiProperty({
    description: 'Optional date string (YYYY-MM-DD). Defaults to today',
    required: false,
    example: '2026-09-23',
  })
  @IsOptional()
  @IsString()
  date?: string;
}

export class UpdateStepGoalDto {
  @ApiProperty({
    description: 'Daily personal step goal (between 1,000 and 100,000 steps)',
    example: 8000,
  })
  @IsInt()
  @Min(1000)
  @Max(100000)
  @Type(() => Number)
  dailyStepGoal: number;
}

