import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ScheduleItemDto {
  @ApiProperty({ example: 'sched_789abc' })
  id: string;

  @ApiProperty({ example: 'user_123' })
  userId: string;

  @ApiProperty({ example: 'WORKOUT' })
  itemType: string;

  @ApiProperty({ example: 'Morning Mobility & Cardio' })
  title: string;

  @ApiPropertyOptional({ example: '30-minute steady state cardio and hip stretches' })
  description?: string | null;

  @ApiProperty({ example: 'DAILY' })
  recurrenceType: string;

  @ApiProperty({ example: [1, 2, 3, 4, 5], type: [Number] })
  daysOfWeek: number[];

  @ApiPropertyOptional({ example: '08:30' })
  timeOfDay?: string | null;

  @ApiProperty({ example: false })
  isPaused: boolean;

  @ApiProperty({ example: '2026-09-24' })
  startDate: string;

  @ApiPropertyOptional({ example: null, nullable: true })
  endDate?: string | null;

  @ApiPropertyOptional({ example: { intensity: 'MEDIUM', duration: 30 } })
  metadata?: any;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-24T10:00:00.000Z' })
  updatedAt: Date;
}

export class CreateScheduleResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: ScheduleItemDto })
  data: ScheduleItemDto;
}

export class ScheduleListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [ScheduleItemDto] })
  data: ScheduleItemDto[];

  @ApiPropertyOptional({ example: '2026-09-24' })
  date?: string;

  @ApiProperty({ example: 1 })
  total: number;
}
