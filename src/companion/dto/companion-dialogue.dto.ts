import { ApiProperty } from '@nestjs/swagger';
import { DialogueTriggerContext } from '../constants/companion-dialogue-matrix.constants';

export class CompanionInfoDto {
  @ApiProperty({ example: 'clx...123', description: 'Companion ID' })
  id: string;

  @ApiProperty({ example: 'Riven', description: 'Companion name' })
  name: string;

  @ApiProperty({ example: 'riven', description: 'Companion slug identifier' })
  slug: string;

  @ApiProperty({ example: 'High Lord of the Forsaken Court', description: 'Companion title' })
  title?: string;

  @ApiProperty({ example: 'Come now. We have things to accomplish.', description: 'Default canonical quote' })
  quote?: string;
}

export class CompanionDialogueResponseDto {
  @ApiProperty({ type: () => CompanionInfoDto, description: 'Active companion details' })
  companion: CompanionInfoDto;

  @ApiProperty({
    enum: DialogueTriggerContext,
    example: DialogueTriggerContext.POST_WORKOUT,
    description: 'The matched situational context trigger',
  })
  triggerContext: DialogueTriggerContext;

  @ApiProperty({
    example: 'Not bad at all. I suppose I can allow you a moment of rest.',
    description: 'Dialogue spoken by the companion',
  })
  text: string;

  @ApiProperty({
    example: 'Hydrate & Refuel',
    required: false,
    description: 'Suggested action call-to-action button prompt',
  })
  actionPrompt?: string;

  @ApiProperty({
    example: '2026-09-22T16:35:00.000Z',
    description: 'Timestamp when dialogue was evaluated',
  })
  timestamp: string;
}
