import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'Margaret Hamilton',
    description: 'Full name of the user',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;

  @ApiProperty({
    example: 'margaret@apollo.nasa.gov',
    description: 'Unique user email address',
  })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsNotEmpty()
  email!: string;

  @ApiPropertyOptional({
    example: 'https://images.example.com/avatar.jpg',
    description: 'Profile image avatar URL',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
