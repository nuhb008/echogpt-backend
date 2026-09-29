import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsString, Min } from 'class-validator';

export class CreatePlanDto {
  @ApiProperty({ example: 'PREMIUM' })
  @IsString()
  name!: string;

  @ApiProperty({
    description: 'Maximum number of AI chat requests allowed per calendar month',
    example: 5000,
  })
  @IsInt()
  @Min(1)
  monthlyLimit!: number;

  @ApiProperty({ example: 9.99 })
  @IsNumber()
  @Min(0)
  price!: number;
}
