import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Current password, required to confirm account deletion',
    example: 'StrongPassword123!',
  })
  @IsString()
  password: string;
}
