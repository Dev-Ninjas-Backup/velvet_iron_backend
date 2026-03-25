import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateThemeDto {
  @ApiProperty({ example: 'Ocean Breeze', description: 'Theme name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Calm and Refreshing', description: 'Theme tagline' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({
    example: 'A soothing ocean-inspired theme',
    description: 'Theme description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 1000, description: 'XP required to unlock' })
  @IsInt()
  @Min(0)
  unlockXp: number;
}
