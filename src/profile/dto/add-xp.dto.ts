import { IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddXpDto {
  @ApiProperty({ example: 100, description: 'Amount of XP to add' })
  @IsInt()
  @Min(1)
  xp: number;
}
