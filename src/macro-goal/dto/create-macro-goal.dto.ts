import { IsString, IsNumber, IsNotEmpty, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export enum CalorieGoalModeEnum {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export class CreateMacroGoalDto {
  @ApiPropertyOptional({ example: 'Maintenance', description: 'Name of the goal profile' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ example: 200, description: 'Carbs in grams' })
  @IsNumber()
  @IsNotEmpty()
  carbs: number;

  @ApiProperty({ example: 60, description: 'Fat in grams' })
  @IsNumber()
  @IsNotEmpty()
  fat: number;

  @ApiProperty({ example: 150, description: 'Protein in grams' })
  @IsNumber()
  @IsNotEmpty()
  protein: number;

  @ApiPropertyOptional({ example: 2000, description: 'Calories in kcal (or calculated automatically)' })
  @IsNumber()
  @IsOptional()
  calories?: number;

  @ApiPropertyOptional({ example: 2000, description: 'Calorie goal alias in kcal' })
  @IsNumber()
  @IsOptional()
  calorieGoal?: number;

  @ApiPropertyOptional({
    enum: CalorieGoalModeEnum,
    example: CalorieGoalModeEnum.AUTO,
    description: 'Goal calculation mode: AUTO or MANUAL',
    default: CalorieGoalModeEnum.AUTO,
  })
  @IsEnum(CalorieGoalModeEnum)
  @IsOptional()
  calorieGoalMode?: CalorieGoalModeEnum;
}
