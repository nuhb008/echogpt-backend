import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'Nuh Islam',
  })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({
    example: 'nuh@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'StrongPassword123!',
  })
  @IsString()
  @MinLength(8)
  password: string;
}