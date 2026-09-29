import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ChangePlanDto {
  @ApiProperty({
    description: 'Target plan id (must be a different price than the current plan)',
    example: 'ba84634a-47d3-4c30-8248-18688a63f318',
  })
  @IsUUID()
  planId!: string;
}
