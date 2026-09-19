import { PartialType } from '@nestjs/swagger';
import { CreateCustomQuestDto } from './create-custom-quest.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCustomQuestDto extends PartialType(CreateCustomQuestDto) {
  @ApiPropertyOptional({
    example: false,
    description: 'Whether the quest is paused',
  })
  @IsBoolean()
  @IsOptional()
  isPaused?: boolean;
}

export class PauseCustomQuestDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Pause or unpause the quest',
  })
  @IsBoolean()
  isPaused: boolean;
}

