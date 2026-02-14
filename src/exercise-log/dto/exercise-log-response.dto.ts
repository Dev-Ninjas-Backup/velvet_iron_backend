import { ApiProperty } from '@nestjs/swagger';

export class ExerciseLogResponseDto {
  @ApiProperty({
    description: 'Exercise log ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Exercise type',
    example: 'CARDIO',
  })
  type: string;

  @ApiProperty({
    description: 'Exercise name',
    example: 'Running',
  })
  name: string;

  @ApiProperty({
    description: 'Exercise intensity',
    example: 'MEDIUM',
  })
  intensity?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 30,
  })
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Morning run',
  })
  note?: string;

  @ApiProperty({
    description: 'When the exercise was logged',
    example: '2026-02-15T10:30:00Z',
  })
  loggedAt: Date;
}

export class ExerciseLogHistoryDto {
  @ApiProperty({
    description: 'Total count of exercise logs',
    example: 45,
  })
  totalCount: number;

  @ApiProperty({
    description: 'List of exercise logs',
    type: [ExerciseLogResponseDto],
  })
  logs: ExerciseLogResponseDto[];
}

export class ExerciseScheduleResponseDto {
  @ApiProperty({
    description: 'Exercise log ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Exercise type',
    example: 'CARDIO',
  })
  type: string;

  @ApiProperty({
    description: 'Exercise name',
    example: 'Running',
  })
  name: string;

  @ApiProperty({
    description: 'Exercise intensity',
  })
  intensity?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 30,
  })
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
  })
  note?: string;

  @ApiProperty({
    description: 'When the exercise was logged',
    example: '2026-02-15T10:30:00Z',
  })
  loggedAt: Date;
}

export class ExerciseScheduleDetailResponseDto {
  @ApiProperty({
    description: 'Exercise schedule ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Exercise type',
    example: 'CARDIO',
  })
  type: string;

  @ApiProperty({
    description: 'Exercise name',
    example: 'Running',
  })
  name: string;

  @ApiProperty({
    description: 'Exercise intensity',
  })
  intensity?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 30,
  })
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
  })
  note?: string;

  @ApiProperty({
    description: 'Scheduled time for exercise',
    example: '2026-02-15T08:00:00Z',
  })
  loggedAt: Date;
}

export class ExerciseScheduleHistoryDto {
  @ApiProperty({
    description: 'Total count of exercise schedules',
    example: 20,
  })
  totalCount: number;

  @ApiProperty({
    description: 'List of exercise schedules',
    type: [ExerciseScheduleDetailResponseDto],
  })
  schedules: ExerciseScheduleDetailResponseDto[];
}
