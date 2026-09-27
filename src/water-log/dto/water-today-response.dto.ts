import { ApiProperty } from '@nestjs/swagger';
import { WaterUnit } from '../../../prisma/generated/enums';

export class PotionFlaskVisualDto {
  @ApiProperty({ example: 'mana_potion_blue', description: 'Visual aesthetic theme name' })
  theme: string;

  @ApiProperty({
    example: 0.6,
    description: 'Normalized fill level between 0.0 and 1.0 (clamped for visual flask)',
  })
  fillLevel: number;
}

export class WaterLogItemDto {
  @ApiProperty({ example: 'uuid-123' })
  id: string;

  @ApiProperty({ example: 16 })
  amount: number;

  @ApiProperty({ enum: WaterUnit, example: 'OZ' })
  unit: WaterUnit;

  @ApiProperty({ example: 473.18 })
  amountMl: number;

  @ApiProperty({ example: 16.0 })
  amountOz: number;

  @ApiProperty({ example: 5 })
  earnedXp: number;

  @ApiProperty({ example: '2026-09-23T08:30:00.000Z' })
  loggedAt: Date;
}

export class WaterTodayResponseDto {
  @ApiProperty({ example: 48, description: 'Current total intake today in preferred unit' })
  currentIntake: number;

  @ApiProperty({ example: 80, description: 'Daily water goal in preferred unit' })
  goal: number;

  @ApiProperty({ enum: WaterUnit, example: 'OZ', description: 'Preferred measurement unit' })
  unit: WaterUnit;

  @ApiProperty({ example: '48 / 80 oz', description: 'Formatted display string' })
  display: string;

  @ApiProperty({ example: 60.0, description: 'Percentage towards daily goal (0 - 100+)' })
  fillPercentage: number;

  @ApiProperty({ example: false, description: 'Whether the daily goal has been met' })
  isGoalReached: boolean;

  @ApiProperty({ type: () => PotionFlaskVisualDto, description: 'Potion flask visual fill state' })
  potionFlask: PotionFlaskVisualDto;

  @ApiProperty({
    example: [8, 16, 24, 32],
    description: 'Quick-add presets tailored to preferred unit',
  })
  quickAdds: number[];

  @ApiProperty({ type: () => [WaterLogItemDto], description: 'Individual logs for today' })
  todayLogs: WaterLogItemDto[];
}

