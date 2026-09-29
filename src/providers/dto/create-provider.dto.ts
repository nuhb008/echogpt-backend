import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProviderType } from '../../common/enums/index.js';

export class CreateProviderDto {
  @ApiProperty({ enum: ProviderType, example: ProviderType.OPENAI })
  @IsEnum(ProviderType)
  name!: ProviderType;

  @ApiProperty({ example: 'gpt-4o-mini' })
  @IsString()
  model!: string;

  @ApiProperty({
    description: 'Provider API key; stored AES-256-GCM encrypted, never returned by the API',
    example: 'sk-...',
  })
  @IsString()
  apiKey!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @ApiPropertyOptional({
    description: 'Make this the default provider used when chat requests omit providerId',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
