import { ApiProperty } from '@nestjs/swagger';

export class FantasyMapStateDto {
  @ApiProperty({ example: 'The Ridge of Watchers', description: 'Name of the most recently reached landmark' })
  currentLandmark: string;

  @ApiProperty({ example: 'The Sunken Citadel', description: 'Name of the next upcoming destination' })
  nextLandmark: string;

  @ApiProperty({ example: 0.85, description: 'Normalized footstep progress ratio on the trail (0.0 to 1.0)' })
  progressRatio: number;

  @ApiProperty({ example: [25, 50, 75], description: 'Unlocked landmark milestone percentages' })
  unlockedMilestones: number[];

  @ApiProperty({
    example: 'Craggy sentinels of stone overlooking the lower valley. From this height, the towers of the destination loom clearly.',
    description: 'Current lore fragment revealed to the traveler',
  })
  activeLore: string;

  @ApiProperty({
    example: 'Look ahead. The destination is almost within grasp. Do not disappoint me now.',
    required: false,
    description: 'Dialogue spoken by the active companion upon reaching this point',
  })
  companionReaction?: string;

  @ApiProperty({ example: 1, required: false, description: '1-indexed canonical milestone reached (1 to 10), or null if none' })
  canonicalMilestoneIndex?: number | null;

  @ApiProperty({ example: 'The Whispering Woods', required: false, description: 'Canonical landmark name' })
  canonicalMilestoneName?: string | null;

  @ApiProperty({ example: 'Mistveil Crossing', required: false, description: 'Next canonical landmark name' })
  nextCanonicalMilestoneName?: string | null;

  @ApiProperty({ example: 75000, required: false, description: 'Steps required for next canonical landmark' })
  nextCanonicalMilestoneSteps?: number | null;
}

export class StepTodayResponseDto {
  @ApiProperty({ example: 6842, description: 'Current steps logged today' })
  steps: number;

  @ApiProperty({ example: 8000, description: 'Personal daily step goal' })
  goal: number;

  @ApiProperty({ example: '6,842 / 8,000 steps', description: 'Formatted display string' })
  display: string;

  @ApiProperty({ example: 85.5, description: 'Percentage of daily goal completed' })
  percentage: number;

  @ApiProperty({ example: false, description: 'Whether daily step goal was met' })
  isGoalReached: boolean;

  @ApiProperty({ example: false, description: 'Whether the user has tapped Set Up Camp for today' })
  isCampSet: boolean;

  @ApiProperty({ example: null, required: false, description: 'Timestamp when camp was pitched' })
  campSetAt?: Date | null;

  @ApiProperty({ example: 45210, description: 'Cumulative lifetime steps traveled across all days' })
  lifetimeSteps: number;

  @ApiProperty({ example: 6, description: 'Total campsites pitched in journey history' })
  totalCampsites: number;

  @ApiProperty({ type: () => FantasyMapStateDto, description: 'Fantasy map journey state and footsteps coordinates' })
  fantasyMap: FantasyMapStateDto;
}

export class SetUpCampResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: true })
  isCampSet: boolean;

  @ApiProperty({ example: '2026-09-23T20:30:00.000Z' })
  campSetAt: Date;

  @ApiProperty({ example: 6842, description: 'Final steps locked in for today' })
  stepsLocked: number;

  @ApiProperty({ example: 45210, description: 'Updated cumulative lifetime steps' })
  lifetimeSteps: number;

  @ApiProperty({ example: 7, description: 'Updated total campsites pitched' })
  totalCampsites: number;

  @ApiProperty({ example: 20, description: 'XP awarded for completing the daily journey and setting up camp' })
  earnedXp: number;

  @ApiProperty({ example: 1, nullable: true, description: '1-indexed canonical milestone index (1 to 10), or null if before milestone 1' })
  unlockedMilestoneIndex: number | null;

  @ApiProperty({ example: 'The Whispering Woods', nullable: true, description: 'Canonical landmark name for the unlocked milestone' })
  unlockedMilestoneName: string | null;

  @ApiProperty({ example: 'Camp pitched successfully! The campfire is lit under the stars.' })
  message: string;
}
