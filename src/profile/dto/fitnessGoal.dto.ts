import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, MinLength, MaxLength } from 'class-validator';

export class fitnessGoalDTO {
  @ApiProperty({
    example: 'Transform my body and grow stronger',
    description: "User's fitness goal description",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(500)
  goal: string;
}
