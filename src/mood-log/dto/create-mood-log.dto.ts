import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsDateString } from 'class-validator';
import {
  Mood,
  EnergyLevel,
  HungerLevel,
} from '../../../prisma/generated/enums';

export { Mood, EnergyLevel, HungerLevel };

export class CreateMoodLogDto {
  @ApiProperty({
    enum: ['TIRED', 'GOOD', 'PISSED', 'GREAT', 'POOR'],
    description: 'Current mood',
    example: 'GOOD',
  })
  @IsEnum(Mood)
  mood: Mood;

  @ApiProperty({
    enum: ['EXHAUSTED', 'LOW', 'MODERATE', 'ENERGIZED', 'HIGH'],
    description: 'Current energy level',
    example: 'MODERATE',
    required: false,
  })
  @IsEnum(EnergyLevel)
  @IsOptional()
  energyLevel?: EnergyLevel;

  @ApiProperty({
    enum: ['NOT_HUNGRY', 'HUNGRY', 'VERY_HUNGRY'],
    description: 'Current hunger level',
    example: 'HUNGRY',
    required: false,
  })
  @IsEnum(HungerLevel)
  @IsOptional()
  hungerLevel?: HungerLevel;

  @ApiProperty({
    description: 'Additional notes about mood',
    example: 'Feeling good after workout',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;

  @ApiProperty({
    description: 'Log timestamp (ISO 8601)',
    example: '2026-02-07T10:30:00Z',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  loggedAt?: string;
}
