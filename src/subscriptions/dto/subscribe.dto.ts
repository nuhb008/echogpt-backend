import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class SubscribeDto {
  @ApiProperty({ example: 'ba84634a-47d3-4c30-8248-18688a63f318' })
  @IsUUID()
  planId!: string;
}
