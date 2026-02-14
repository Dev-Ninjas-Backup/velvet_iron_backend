import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { MedicationType } from '../../../prisma/generated/enums';

export class CreateMedicationDto {
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
}

export class UpdateMedicationDto {
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
}
