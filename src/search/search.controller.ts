import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
import { SearchSuggestionsQueryDto } from './dto/search-suggestions-query.dto.js';
import { SearchService } from './search.service.js';

@ApiBearerAuth()
@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: 'Run a web search and record it in the search history' })
  @ApiResponse({ status: 201, description: 'Search results returned' })
  @ApiResponse({ status: 502, description: 'The upstream search provider request failed' })
  @Post()
  search(@CurrentUser() user: AuthenticatedUser, @Body() dto: SearchQueryDto) {
    return this.searchService.search(user.id, dto);
  }

  @ApiOperation({ summary: "Get the current user's full search history (most recent 50)" })
  @ApiResponse({ status: 200, description: 'Search history returned' })
  @Get('history')
  history(@CurrentUser() user: AuthenticatedUser) {
    return this.searchService.history(user.id);
  }

  @ApiOperation({ summary: "Get the current user's distinct recent queries" })
  @ApiResponse({ status: 200, description: 'Recent queries returned' })
  @Get('recent')
  recent(@CurrentUser() user: AuthenticatedUser) {
    return this.searchService.recent(user.id);
  }

  @ApiOperation({ summary: "Get autocomplete suggestions from the user's history and an external provider" })
  @ApiResponse({ status: 200, description: 'Suggestions returned' })
  @ApiResponse({ status: 400, description: 'q query parameter is missing or empty' })
  @Get('suggestions')
  suggestions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: SearchSuggestionsQueryDto,
  ) {
    return this.searchService.suggestions(user.id, query.q);
  }
}
