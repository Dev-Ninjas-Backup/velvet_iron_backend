import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateWeightLogDto {
  @ApiProperty({
    description: 'Weight in lbs as a string',
    example: '165.5',
  })
  @IsString()
  @IsNotEmpty()
  weight: string;

  @ApiProperty({
    description: 'Optional note about the weight log',
    example: 'Morning weight after breakfast',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateWeightLogDto {
  @ApiProperty({
    description: 'Weight in lbs as a string',
    example: '165.5',
    required: false,
  })
  @IsOptional()
  @IsString()
  weight?: string;

  @ApiProperty({
    description: 'Optional note about the weight log',
    example: 'Morning weight after breakfast',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}
