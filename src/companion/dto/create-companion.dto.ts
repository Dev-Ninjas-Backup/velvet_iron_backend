import { IsNotEmpty, IsString, IsInt, Min, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanionDto {
  @ApiProperty({ example: 'Luna', description: 'Companion name' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'The Wise Guide', description: 'Companion title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    example: 'Every journey begins with a single step',
    description: 'Companion quote',
  })
  @IsOptional()
  @IsString()
  quote?: string;

  @ApiProperty({ example: 5000, description: 'XP required to unlock' })
  @IsInt()
  @Min(0)
  unlockXp: number;
}
