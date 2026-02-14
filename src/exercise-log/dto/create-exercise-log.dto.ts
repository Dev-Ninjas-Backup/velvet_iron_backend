import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
} from 'class-validator';
import { exercise_intensity, exercise_type } from 'generated/enums';

export class CreateExerciseLogDto {
  @ApiProperty({
    description: 'Type of exercise',
    enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
    example: 'CARDIO',
  })
  @IsEnum(exercise_type)
  @IsNotEmpty()
  type: exercise_type;

  @ApiProperty({
    description: 'Name of the exercise',
    example: 'Running',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Intensity level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
    example: 'MEDIUM',
  })
  @IsOptional()
  @IsEnum(exercise_intensity)
  intensity?: exercise_intensity;

  @ApiProperty({
    description: 'Duration in minutes',
    example: 30,
    required: false,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
    example: 'Morning run',
    required: false,
  })
  @IsOptional()
  @IsString()
  note?: string;
}

export class UpdateExerciseLogDto {
  @ApiProperty({
    description: 'Type of exercise',
    enum: ['CARDIO', 'STRENGTH', 'FLEXIBILITY', 'BALANCE'],
    required: false,
    example: 'STRENGTH',
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiProperty({
    description: 'Name of the exercise',
    required: false,
    example: 'Push-ups',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Intensity level',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    required: false,
    example: 'HIGH',
  })
  @IsOptional()
  @IsString()
  intensity?: string;

  @ApiProperty({
    description: 'Duration in minutes',
    required: false,
    example: 45,
  })
  @IsOptional()
  @IsInt()
  duration?: number;

  @ApiProperty({
    description: 'Additional notes',
    required: false,
    example: 'Evening workout',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
