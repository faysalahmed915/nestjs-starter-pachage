import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Ada Lovelace',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'ada@example.com',
    description: 'Unique email address',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'SuperSecure!99Password',
    description:
      'Password meeting complexity requirements (at least 8 characters with upper, lower, number, and special character)',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(
    /((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/,
    {
      message:
        'Password too weak. Must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number or special character',
    },
  )
  password!: string;
}
