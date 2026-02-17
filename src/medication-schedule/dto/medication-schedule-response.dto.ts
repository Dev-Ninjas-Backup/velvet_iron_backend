import { ApiProperty } from '@nestjs/swagger';
import { MedicationType } from '../../../prisma/generated/enums';

export class MedicationScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ description: 'Name of the medication' })
  name: string;

  @ApiProperty({
    description: 'Type of medication',
    enum: MedicationType,
    required: false,
  })
  type?: MedicationType;

  @ApiProperty({ description: 'Dose in mg', required: false })
  doseMg?: number;

  @ApiProperty({ description: 'Scheduled time for medication' })
  scheduleTime: Date;

  @ApiProperty({ description: 'Whether the medication was taken', required: false })
  isTaken?: boolean | null;
}

export class MedicationScheduleHistoryWithStatsDto {
  @ApiProperty({ description: 'Total number of medication schedules' })
  totalCount: number;

  @ApiProperty({ type: [MedicationScheduleResponseDto] })
  schedules: MedicationScheduleResponseDto[];
}

export class TodaySchedulesDto {
  @ApiProperty({ description: 'Number of scheduled doses for today' })
  totalToday: number;

  @ApiProperty({ type: [MedicationScheduleResponseDto] })
  schedules: MedicationScheduleResponseDto[];
}
