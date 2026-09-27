import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { WaterUnit } from '../../../prisma/generated/enums';

export { WaterUnit };

export class LogWaterDto {
  @ApiProperty({
    description: 'Amount of water consumed (e.g. 8, 16, 250, 500)',
    example: 16,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  amount: number;

  @ApiProperty({
    description: 'Unit of measurement (OZ or ML). Optional: defaults to user preferred unit',
    enum: WaterUnit,
    required: false,
    example: 'OZ',
  })
  @IsOptional()
  @IsEnum(WaterUnit)
  unit?: WaterUnit;

  @ApiProperty({
    description: 'Optional timestamp (ISO string)',
    required: false,
    example: '2026-09-23T09:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  loggedAt?: string;
}

export class UpdateWaterGoalDto {
  @ApiProperty({
    description: 'Daily water goal amount (e.g. 64, 80 for oz; 2000, 2500 for mL)',
    example: 80,
  })
  @IsNumber()
  @IsPositive()
  @Type(() => Number)
  dailyWaterGoal: number;

  @ApiProperty({
    description: 'Preferred unit for display (OZ or ML)',
    enum: WaterUnit,
    example: 'OZ',
  })
  @IsEnum(WaterUnit)
  waterUnit: WaterUnit;
}

