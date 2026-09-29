import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { SearchQueryDto } from './dto/search-query.dto.js';
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
}
