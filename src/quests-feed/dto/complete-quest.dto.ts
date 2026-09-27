import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';
import { QuestType } from './quests-feed-response.dto';

export class CompleteQuestDto {
  @ApiProperty({ example: 'med_123e4567' })
  @IsString()
  questId: string;

  @ApiProperty({ enum: QuestType })
  @IsEnum(QuestType)
  questType: QuestType;
}
