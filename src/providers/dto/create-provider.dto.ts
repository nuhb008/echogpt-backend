import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { ProviderType } from '../../common/enums/index.js';

export class CreateProviderDto {
  @IsEnum(ProviderType)
  name!: ProviderType;

  @IsString()
  model!: string;

  @IsString()
  apiKey!: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
