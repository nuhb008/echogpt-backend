import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @ApiPropertyOptional({
    description: 'Existing conversation to append to; omit to start a new conversation',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  conversationId?: string;

  @ApiProperty({
    example: 'Explain machine learning simply',
  })
  @IsString()
  content!: string;

  @ApiPropertyOptional({
    description: 'AI provider to use; omit to use the configured default provider',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  @IsOptional()
  @IsUUID()
  providerId?: string;
}
