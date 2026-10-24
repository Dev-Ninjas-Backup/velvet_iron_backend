import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { QuestType } from './quests-feed-response.dto';

export class CompleteQuestDto {
  @ApiProperty({ example: 'custom_123e4567', description: 'Quest identifier or original ID' })
  @IsString()
  @Transform(({ value, obj }) => value || obj?.id)
  questId: string;

  @ApiProperty({
    enum: QuestType,
    required: false,
    description: 'Quest type: CODEX, CUSTOM, MEDICATION_SCHEDULE, WORKOUT_SCHEDULE (auto-inferred if omitted)',
  })
  @IsOptional()
  @Transform(({ value, obj }) => {
    if (typeof value === 'string' && value.trim()) {
      const upper = value.trim().toUpperCase();
      if (Object.values(QuestType).includes(upper as QuestType)) {
        return upper as QuestType;
      }
    }
    const targetId = obj?.questId || obj?.id;
    if (typeof targetId === 'string') {
      if (targetId.startsWith('custom_')) return QuestType.CUSTOM;
      if (targetId.startsWith('med_')) return QuestType.MEDICATION_SCHEDULE;
      if (targetId.startsWith('workout_')) return QuestType.WORKOUT_SCHEDULE;
      if (targetId.startsWith('codex_')) return QuestType.CODEX;
    }
    return value;
  })
  @IsEnum(QuestType)
  questType?: QuestType;

  @ApiProperty({
    example: '2026-10-24',
    required: false,
    description: 'Target local calendar date (YYYY-MM-DD), defaults to today',
  })
  @IsOptional()
  @IsString()
  dateStr?: string;
}

