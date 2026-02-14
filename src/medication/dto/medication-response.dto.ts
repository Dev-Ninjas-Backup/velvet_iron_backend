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

export class MedicationHistoryWithStatsDto {
  @ApiProperty({ description: 'Total number of medications' })
  totalCount: number;

  @ApiProperty({ type: [MedicationResponseDto] })
  medications: MedicationResponseDto[];
}
