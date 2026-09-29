import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto.js';
import { SearchService } from './search.service.js';

@ApiBearerAuth()
@ApiTags('search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Post()
  search(@CurrentUser() user: AuthenticatedUser, @Body() dto: SearchQueryDto) {
    return this.searchService.search(user.id, dto);
  }

  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.searchService.history(user.id);
  }

  @Get('recent')
  recent(@CurrentUser() user: AuthenticatedUser) {
    return this.searchService.recent(user.id);
  }

  @Get('suggestions')
  suggestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchSuggestionsQueryDto,
  ) {
    return this.searchService.suggestions(user.id, query.q);
  }
}
