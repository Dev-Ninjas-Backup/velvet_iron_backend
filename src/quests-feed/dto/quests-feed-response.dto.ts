import { ApiProperty } from '@nestjs/swagger';

export enum QuestType {
  CODEX = 'CODEX',
  CUSTOM = 'CUSTOM',
  MEDICATION_SCHEDULE = 'MEDICATION_SCHEDULE',
  WORKOUT_SCHEDULE = 'WORKOUT_SCHEDULE',
}

export class UnifiedQuestItemDto {
  @ApiProperty({ example: 'med_123e4567' })
  id: string;

  @ApiProperty({ example: 'Aspirin' })
  title: string;

  @ApiProperty({ example: 'Dose: 500mg' })
  description?: string;

  @ApiProperty({ example: 10 })
  xpReward: number;

  @ApiProperty({ example: false })
  isCompleted: boolean;

  @ApiProperty({ enum: QuestType })
  questType: QuestType;

  @ApiProperty({ example: '123e4567' })
  originalRefId: string;
}
