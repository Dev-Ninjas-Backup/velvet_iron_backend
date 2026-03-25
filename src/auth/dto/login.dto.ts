import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';
import dotenv from 'dotenv';
dotenv.config();

export class loginDto {
  //example email collect from env dynamic
  @ApiProperty({
    example: process.env.SUPERADMIN_EMAIL || 'user@example.com',
    description: 'Email address of the user',
  })
  @IsNotEmpty({ message: 'Email or Username is required.' })
  @IsString({ message: 'Email or Username must be a string.' })
  emailOrUsername: string;
  
  @ApiProperty({
    example: process.env.SUPERADMIN_PASSWORD || 'strongPassword1234',
    description: 'Password for the user account',
  })
  @IsNotEmpty({ message: 'Password is required.' })
  password: string;
}
