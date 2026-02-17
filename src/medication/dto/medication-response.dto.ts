import { ApiProperty } from '@nestjs/swagger';
import { MedicationType } from '../../../prisma/generated/enums';

export class MedicationResponseDto {
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

  @ApiProperty()
  createdAt: Date;
}

export class MedicationHistoryLogDto {
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

  @ApiProperty({ description: 'Whether the dose was taken' })
  isTaken: boolean;

  @ApiProperty({
    description: 'Timestamp representing when the entry was logged',
    type: String,
    format: 'date-time',
    required: false,
  })
  loggedAt?: Date | null;

  @ApiProperty({
    description: 'Scheduled time for the medication (if applicable)',
    type: String,
    format: 'date-time',
    required: false,
  })
  scheduledAt?: Date | null;

  @ApiProperty({
    description: 'Origin of the entry',
    enum: ['LOG', 'SCHEDULE'],
  })
  entryType: 'LOG' | 'SCHEDULE';
}

export class MedicationHistoryWithStatsDto {
  @ApiProperty({ description: 'Combined number of medication logs and schedules' })
  totalCount: number;

  @ApiProperty({ description: 'Number of entries where the dose is still pending' })
  pendingCount: number;

  @ApiProperty({ type: [MedicationHistoryLogDto] })
  logs: MedicationHistoryLogDto[];
}
