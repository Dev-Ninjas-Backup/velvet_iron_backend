import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddXpDto {
  @ApiProperty({ example: 100, description: 'Amount of XP to add' })
  @IsInt()
  @Min(1)
  xp: number;


  @ApiProperty({ example: 'Completed a workout', description: 'Reason for adding XP' })
  @IsOptional()
  @IsString()
  reason?: string;
}
