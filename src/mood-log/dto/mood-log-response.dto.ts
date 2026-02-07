import { ApiProperty } from '@nestjs/swagger';
import { Mood, EnergyLevel, HungerLevel } from './create-mood-log.dto';

export class MoodLogResponseDto {
  @ApiProperty({
    description: 'Mood log ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  userId: string;

  @ApiProperty({
    enum: Mood,
    description: 'Logged mood',
    example: Mood.GOOD,
  })
  mood: Mood;

  @ApiProperty({
    enum: EnergyLevel,
    description: 'Logged energy level',
    example: EnergyLevel.MODERATE,
    nullable: true,
  })
  energyLevel: EnergyLevel | null;

  @ApiProperty({
    enum: HungerLevel,
    description: 'Logged hunger level',
    example: HungerLevel.HUNGRY,
    nullable: true,
  })
  hungerLevel: HungerLevel | null;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Feeling good after workout',
    nullable: true,
  })
  note: string | null;

  @ApiProperty({
    description: 'When the mood was logged',
    example: '2026-02-07T10:30:00.000Z',
  })
  loggedAt: Date;
}

export class MoodLogHistoryDto {
  @ApiProperty({
    type: [MoodLogResponseDto],
    description: 'List of mood logs',
  })
  logs: MoodLogResponseDto[];

  @ApiProperty({
    description: 'Total number of mood logs',
    example: 42,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Most recent mood',
    enum: Mood,
    example: Mood.GOOD,
    nullable: true,
  })
  currentMood: Mood | null;
}
