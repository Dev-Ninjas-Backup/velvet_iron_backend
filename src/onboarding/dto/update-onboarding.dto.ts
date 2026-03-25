import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateOnboardingDto {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  @ApiPropertyOptional({
    type: Boolean,
    description:
      'Set to true if onboarding is complete, false to mark incomplete',
    example: false,
  })
  iscomplete?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    type: String,
    description: 'Fitness goal of the user',
    example: 'Weight Loss',
  })
  fitnessGoal?: string;
}
