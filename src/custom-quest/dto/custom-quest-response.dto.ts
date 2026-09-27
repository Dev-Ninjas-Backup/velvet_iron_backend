import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomQuestResponseDto {
  @ApiProperty({ example: 'cquest_789abc' })
  id: string;

  @ApiPropertyOptional({ example: 'user_123' })
  userId?: string;

  @ApiProperty({ example: 'Evening Stretch' })
  title: string;

  @ApiProperty({ example: 'Evening Stretch' })
  name: string;

  @ApiPropertyOptional({ example: '10 minutes of hip and back mobility' })
  description?: string;

  @ApiProperty({ example: 'GENERAL' })
  category: string;

  @ApiProperty({ example: 15 })
  xpReward: number;

  @ApiProperty({ example: 15 })
  xp: number;

  @ApiProperty({ example: 'DAILY' })
  frequency: string;

  @ApiProperty({ example: 'DAILY' })
  recurrence: string;

  @ApiProperty({ example: false })
  isCompleted: boolean;

  @ApiProperty({ example: false })
  isDone: boolean;

  @ApiPropertyOptional({ example: '2026-09-24T10:00:00.000Z', nullable: true })
  completedAt?: Date | null;

  @ApiPropertyOptional({ example: '2026-09-18' })
  scheduledDate?: string;

  @ApiPropertyOptional({ example: '08:00' })
  scheduledTime?: string;

  @ApiPropertyOptional({ example: [1, 2, 3, 4, 5], type: [Number] })
  daysOfWeek?: number[];

  @ApiProperty({ example: true })
  reminderEnabled: boolean;

  @ApiPropertyOptional({ example: '07:45' })
  reminderTime?: string;

  @ApiProperty({ example: false })
  isPaused: boolean;

  @ApiProperty({ example: true })
  isCustom: boolean;

  @ApiProperty({ example: '2026-09-18T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-18T00:00:00.000Z' })
  updatedAt: Date;
}

export class CustomQuestCreateResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CustomQuestResponseDto })
  data: CustomQuestResponseDto;
}

export class CustomQuestMetaDto {
  @ApiProperty({ example: 15, description: 'XP earned from custom quests today' })
  todayCustomXpEarned: number;

  @ApiProperty({ example: 50, description: 'Daily limit of XP from custom quests' })
  dailyCustomXpCap: number;
}

export class CustomQuestListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [CustomQuestResponseDto] })
  data: CustomQuestResponseDto[];

  @ApiPropertyOptional({ type: [CustomQuestResponseDto] })
  quests?: CustomQuestResponseDto[];

  @ApiProperty({ type: CustomQuestMetaDto })
  meta: CustomQuestMetaDto;
}

export class CompletedQuestDataDto {
  @ApiProperty({ example: 'cquest_789abc' })
  id: string;

  @ApiProperty({ example: true })
  isCompleted: boolean;

  @ApiProperty({ example: 15 })
  xpAwarded: number;

  @ApiProperty({ example: 460 })
  companionTotalXp: number;

  @ApiProperty({ example: 3 })
  companionLevel: number;
}

export class CompleteCustomQuestResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: CompletedQuestDataDto })
  data: CompletedQuestDataDto;

  @ApiPropertyOptional({ type: CustomQuestResponseDto })
  quest?: CustomQuestResponseDto;

  @ApiPropertyOptional({ example: 15 })
  earnedXp?: number;

  @ApiPropertyOptional({ example: 460 })
  newBalanceXp?: number;
}
