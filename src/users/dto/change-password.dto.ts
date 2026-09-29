import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
  })
  @IsString()
  currentPassword: string;

  // bcrypt ignores everything after 72 bytes
  @ApiProperty({
    example: 'NewPassword123!',
    minLength: 8,
    maxLength: 72,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  newPassword: string;
}
