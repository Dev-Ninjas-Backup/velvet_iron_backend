import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
} from 'class-validator';
import { MedicationType } from '../../../prisma/generated/enums';

export class CreateMedicationScheduleDto {
  @ApiProperty({
    description: 'Name of the medication',
    example: 'Aspirin',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of medication',
    enum: MedicationType,
    required: false,
    example: MedicationType.TABLET,
  })
  @IsOptional()
  @IsEnum(MedicationType)
  type?: MedicationType;

  @ApiProperty({
    description: 'Dose in mg',
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsInt()
  doseMg?: number;

  @ApiProperty({
    description: 'Scheduled time for medication',
    example: '2026-02-15T08:00:00Z',
  })
  @IsDateString()
  @IsNotEmpty()
  scheduleTime: string;
}

export class UpdateMedicationScheduleDto {
  @ApiProperty({
    description: 'Name of the medication',
    example: 'Aspirin',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Type of medication',
    enum: MedicationType,
    required: false,
    example: MedicationType.TABLET,
  })
  @IsOptional()
  @IsEnum(MedicationType)
  type?: MedicationType;

  @ApiProperty({
    description: 'Dose in mg',
    example: 500,
    required: false,
  })
  @IsOptional()
  @IsInt()
  doseMg?: number;

  @ApiProperty({
    description: 'Scheduled time for medication',
    example: '2026-02-15T08:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  scheduleTime?: string;
}
