import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';

export class UpdateUserDto {
  @ApiPropertyOptional({
    example: 'Margaret H. Software',
    description: 'Updated full name',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    example: 'updated.email@apollo.nasa.gov',
    description: 'Updated email address',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email address' })
  email?: string;

  @ApiPropertyOptional({
    example: 'https://images.example.com/new-avatar.jpg',
    description: 'Updated avatar URL',
  })
  @IsOptional()
  @IsString()
  image?: string;
}
