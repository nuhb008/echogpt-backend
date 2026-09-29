import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchQueryDto {
  @ApiProperty({
    example: 'best PostgreSQL indexing strategies',
  })
  @IsString()
  @MinLength(1)
  query!: string;
}
