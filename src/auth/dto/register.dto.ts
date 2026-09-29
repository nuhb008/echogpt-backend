import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

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
  // bcrypt ignores everything after 72 bytes
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}