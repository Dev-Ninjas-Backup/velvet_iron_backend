import { IsString, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CalorieGoalModeEnum } from './create-macro-goal.dto';

export class UpdateMacroGoalDto {
  @ApiPropertyOptional({ example: 'Cutting Target' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 180 })
  @IsNumber()
  @IsOptional()
  carbs?: number;

  @ApiPropertyOptional({ example: 50 })
  @IsNumber()
  @IsOptional()
  fat?: number;

  @ApiPropertyOptional({ example: 160 })
  @IsNumber()
  @IsOptional()
  protein?: number;

  @ApiPropertyOptional({ example: 1900 })
  @IsNumber()
  @IsOptional()
  calories?: number;

  @ApiPropertyOptional({ example: 1900 })
  @IsNumber()
  @IsOptional()
  calorieGoal?: number;

  @ApiPropertyOptional({ enum: CalorieGoalModeEnum, example: CalorieGoalModeEnum.MANUAL })
  @IsEnum(CalorieGoalModeEnum)
  @IsOptional()
  calorieGoalMode?: CalorieGoalModeEnum;
}
