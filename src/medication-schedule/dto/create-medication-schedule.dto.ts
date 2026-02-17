import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsBoolean,
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

  @ApiProperty({
    description: 'Whether the medication was taken',
    required: false,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isTaken?: boolean;
}

export class UpdateMedicationScheduleDto {
  @ApiProperty({
    description: 'Name of the medication',
    example: 'Aspirin',
    required: false,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Type of medication',
    enum: MedicationType,
    required: false,
    example: MedicationType.TABLET,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsEnum(MedicationType)
  type?: MedicationType;

  @ApiProperty({
    description: 'Dose in mg',
    example: 500,
    required: false,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsInt()
  doseMg?: number;

  @ApiProperty({
    description: 'Scheduled time for medication',
    example: '2026-02-15T08:00:00Z',
    required: false,
  })
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsOptional()
  @IsDateString()
  scheduleTime?: string;

  @ApiProperty({
    description: 'Whether the medication was taken',
    required: false,
    example: true,
  })
  @Transform(({ value }) => {
    if (value === '' || value === undefined || value === null) {
      return undefined;
    }
    if (typeof value === 'string') {
      const normalized = value.trim().toLowerCase();
      if (['true', '1', 'on'].includes(normalized)) return true;
      if (['false', '0', 'off'].includes(normalized)) return false;
      return undefined;
    }
    if (typeof value === 'number') {
      if (value === 1) return true;
      if (value === 0) return false;
    }
    if (value === true || value === false) {
      return value;
    }
    return value;
  })
  @IsOptional()
  @IsBoolean()
  isTaken?: boolean;
}
