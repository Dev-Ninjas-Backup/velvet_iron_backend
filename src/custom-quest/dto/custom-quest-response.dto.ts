import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomQuestResponseDto {
  @ApiProperty({ example: 'b94e39c4-1111-4444-9999-000000000001' })
  id: string;

  @ApiProperty({ example: 'Morning Walk & Sunlight' })
  name: string;

  @ApiProperty({ example: 'FITNESS' })
  category: string;

  @ApiPropertyOptional({ example: '15 minute walk outside after waking up' })
  description?: string;

  @ApiPropertyOptional({ example: '2026-09-18' })
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '08:00' })
  scheduledTime?: string;

  @ApiProperty({ example: 'DAILY' })
  recurrence: string;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5], type: [Number] })
  daysOfWeek?: number[];

  @ApiProperty({ example: true })
  reminderEnabled: boolean;

  @ApiPropertyOptional({ example: '07:45' })
  reminderTime?: string;

  @ApiProperty({ example: false })
  isDone: boolean;

  @ApiProperty({ example: false })
  isPaused: boolean;

  @ApiProperty({ example: 10 })
  xp: number;

  @ApiProperty({ example: true })
  isCustom: boolean;

  @ApiProperty({ example: '2026-09-18T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-18T00:00:00.000Z' })
  updatedAt: Date;
}

export class CustomQuestListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [CustomQuestResponseDto] })
  quests: CustomQuestResponseDto[];
}

export class CompleteCustomQuestResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CustomQuestResponseDto })
  quest: CustomQuestResponseDto;

  @ApiProperty({ example: 10 })
  earnedXp: number;

  @ApiProperty({ example: 120 })
  newBalanceXp: number;
}

