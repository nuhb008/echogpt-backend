import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class SearchSuggestionsQueryDto {
  @ApiProperty({
    description: 'Partial search query to get autocomplete suggestions for',
    example: 'nestjs pri',
  })
  @IsString()
  @MinLength(1)
  q: string;
}
