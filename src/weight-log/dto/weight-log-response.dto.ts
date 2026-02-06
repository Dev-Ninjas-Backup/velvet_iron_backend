import { ApiProperty } from '@nestjs/swagger';

export class WeightLogResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ description: 'Weight in lbs' })
  weight: string;

  @ApiProperty({ required: false })
  note?: string;

  @ApiProperty()
  loggedAt: Date;

  @ApiProperty({
    description:
      'Weight change from previous log (positive = increase, negative = decrease)',
    required: false,
  })
  weightChange?: string;
}

export class WeightChartDataDto {
  @ApiProperty({ description: 'Date of the weight log' })
  date: string;

  @ApiProperty({ description: 'Weight in kg (converted from lbs)' })
  weight: string;
}

export class WeeklyWeightChartDto {
  @ApiProperty({ type: [WeightChartDataDto] })
  thisWeek: WeightChartDataDto[];

  @ApiProperty({ type: [WeightChartDataDto] })
  lastWeek: WeightChartDataDto[];

  @ApiProperty({ description: 'Average weight this week in kg' })
  thisWeekAverage: string | null;

  @ApiProperty({ description: 'Average weight last week in kg' })
  lastWeekAverage: string | null;

  @ApiProperty({
    description: 'Weight change from last week to this week in kg',
  })
  weeklyChange: string | null;
}

export class WeightHistoryWithStatsDto {
  @ApiProperty({ description: 'Current weight (most recent)' })
  currentWeight: string | null;

  @ApiProperty({ description: 'Total weight change from first to current' })
  totalChanges: string | null;

  @ApiProperty({ description: 'Total number of weight logs' })
  totalLogsCount: number;

  @ApiProperty({ type: [WeightLogResponseDto] })
  history: WeightLogResponseDto[];
}

export class UpdateWeightLogDto {
  @ApiProperty({ description: 'Weight in lbs', required: false })
  weight?: string;

  @ApiProperty({ description: 'Optional note', required: false })
  note?: string;
}
