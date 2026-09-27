import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, IsNotEmpty } from 'class-validator';
import { QuestType } from './quests-feed-response.dto';

export class CompleteQuestDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  questId: string;

  @ApiProperty({ enum: QuestType })
  @IsEnum(QuestType)
  questType: QuestType;
}
