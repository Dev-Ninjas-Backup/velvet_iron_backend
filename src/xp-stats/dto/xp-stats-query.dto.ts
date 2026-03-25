import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class XpStatsQueryDto {
  @ApiPropertyOptional({
    description: 'Period for statistics (today, week, month)',
    enum: ['today', 'week', 'month'],
    example: 'week',
  })
  @IsOptional()
  @IsString()
  period?: 'today' | 'week' | 'month';
}
