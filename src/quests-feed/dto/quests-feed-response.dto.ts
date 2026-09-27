import { ApiProperty } from '@nestjs/swagger';

export enum QuestType {
  CODEX = 'CODEX',
  CUSTOM = 'CUSTOM',
  MEDICATION_SCHEDULE = 'MEDICATION_SCHEDULE',
  WORKOUT_SCHEDULE = 'WORKOUT_SCHEDULE',
}

export class UnifiedQuestItemDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  xpReward: number;

  @ApiProperty()
  isCompleted: boolean;

  @ApiProperty({ enum: QuestType })
  questType: QuestType;

  @ApiProperty()
  originalRefId: string;
}

export class TodaysQuestsResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: [UnifiedQuestItemDto] })
  data: UnifiedQuestItemDto[];

  @ApiProperty()
  meta: {
    totalQuests: number;
    completedQuests: number;
    todayCustomXpEarned: number;
    dailyCustomXpCap: number;
  };
}
