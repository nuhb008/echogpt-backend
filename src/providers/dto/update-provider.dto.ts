import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateProviderDto {
  @ApiPropertyOptional({ example: 'gpt-4o-mini' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'Provider API key; stored AES-256-GCM encrypted, never returned by the API',
    example: 'sk-...',
  })
  @IsOptional()
  @IsString()
  apiKey?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Make this the default provider used when chat requests omit providerId',
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
