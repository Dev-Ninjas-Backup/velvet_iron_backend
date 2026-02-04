import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsDateString, ValidateIf } from 'class-validator';

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
  OTHER = 'OTHER',
  PREFER_NOT_TO_SAY = 'PREFER_NOT_TO_SAY',
}

export class UpdateProfileDto {
  @ApiProperty({
    example: 'John Doe',
    required: false,
    description: 'User full name',
  })
  @IsOptional()
  @ValidateIf((o) => o.name !== '' && o.name !== null)
  @IsString()
  name?: string;

  @ApiProperty({
    example: '',
    required: false,
    description: 'Unique username',
  })
  @IsOptional()
  @ValidateIf((o) => o.username !== '' && o.username !== null)
  @IsString()
  username?: string;

  @ApiProperty({
    enum: GenderEnum,
    example: 'MALE',
    required: false,
    description: 'Gender (MALE, FEMALE, OTHER, PREFER_NOT_TO_SAY)',
  })
  @IsOptional()
  @ValidateIf((o) => o.gender !== '' && o.gender !== null)
  @IsEnum(GenderEnum)
  gender?: GenderEnum;

  @ApiProperty({
    example: '1990-01-15',
    required: false,
    description: 'Date of birth (YYYY-MM-DD format)',
  })
  @IsOptional()
  @ValidateIf((o) => o.dateOfBirth !== '' && o.dateOfBirth !== null)
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Profile photo file (images only: jpeg, jpg, png, gif, webp, svg)',
    required: false,
  })
  @IsOptional()
  profilePhoto?: Express.Multer.File;

  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Avatar file (images only: jpeg, jpg, png, gif, webp, svg)',
    required: false,
  })
  @IsOptional()
  avatar?: Express.Multer.File;
}
