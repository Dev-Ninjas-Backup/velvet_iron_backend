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
    description: 'Whether the exercise was taken',
    example: true,
  })
  isTaken?: boolean | null;

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

  @ApiProperty({ description: 'XP earned for completing the exercise', example: 10 })
  earnedXp: number;
}

export class ExerciseHistoryLogDto {
  @ApiProperty({ description: 'Entry ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Exercise type' })
  type: string;

  @ApiProperty({ description: 'Exercise name' })
  name: string;

  @ApiProperty({ description: 'Exercise intensity', required: false })
  intensity?: string;

  @ApiProperty({ description: 'Duration in minutes', required: false })
  duration?: number;

  @ApiProperty({ description: 'Additional notes', required: false })
  note?: string;

  @ApiProperty({ description: 'Whether the exercise was completed' })
  isTaken: boolean;

  @ApiProperty({ description: 'XP linked to the entry' })
  earnedXp: number;

  @ApiProperty({
    description: 'Timestamp representing when the entry was logged',
    type: String,
    format: 'date-time',
  })
  loggedAt: Date;

  @ApiProperty({
    description: 'Scheduled timestamp for the exercise (if applicable)',
    type: String,
    format: 'date-time',
    required: false,
    nullable: true,
  })
  scheduledAt?: Date | null;

  @ApiProperty({ description: 'Source of the entry', enum: ['LOG', 'SCHEDULE'] })
  entryType: 'LOG' | 'SCHEDULE';
}

export class ExerciseLogHistoryDto {
  @ApiProperty({
    description: 'Total count of exercise logs',
    example: 45,
  })
  totalCount: number;

  @ApiProperty({ description: 'Entries still awaiting completion', example: 3 })
  pendingCount: number;

  @ApiProperty({ description: 'Total XP earned from completed entries', example: 120 })
  totalEarnedXp: number;

  @ApiProperty({
    description: 'Upcoming schedule entry that is still pending',
    type: ExerciseHistoryLogDto,
    nullable: true,
  })
  nextSchedule: ExerciseHistoryLogDto | null;

  @ApiProperty({
    description: 'Combined view of exercise logs and schedules',
    type: [ExerciseHistoryLogDto],
  })
  logs: ExerciseHistoryLogDto[];
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

  @ApiProperty({
    description: 'Whether the exercise was done',
    required: false,
  })
  isTaken?: boolean | null;
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
