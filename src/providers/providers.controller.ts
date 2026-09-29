import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/index.js';
import { CreateProviderDto } from './dto/create-provider.dto.js';
import { UpdateProviderDto } from './dto/update-provider.dto.js';
import { ProvidersService } from './providers.service.js';

@ApiBearerAuth()
@ApiTags('AI Providers')
@Roles(RoleName.ADMIN)
@Controller('providers')
export class ProvidersController {
  constructor(private readonly providersService: ProvidersService) {}

  @ApiOperation({ summary: 'List configured AI providers (admin only; API keys are never returned)' })
  @ApiResponse({ status: 200, description: 'Providers returned' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Get()
  findAll() {
    return this.providersService.findAll();
  }

  @ApiOperation({ summary: 'Add an AI provider (admin only); the API key is AES-256-GCM encrypted at rest' })
  @ApiResponse({ status: 201, description: 'Provider created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Post()
  create(@Body() dto: CreateProviderDto) {
    return this.providersService.create(dto);
  }

  @ApiOperation({ summary: 'Update an AI provider (admin only)' })
  @ApiResponse({ status: 200, description: 'Provider updated' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProviderDto) {
    return this.providersService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete an AI provider (admin only)' })
  @ApiResponse({ status: 200, description: 'Provider deleted' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.providersService.remove(id);
  }

  @ApiOperation({ summary: "Ping a provider with its real API key to verify it works (doesn't count toward usage limits)" })
  @ApiResponse({ status: 201, description: '{ healthy: boolean, latencyMs: number, error?: string }' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  @Post(':id/health-check')
  healthCheck(@Param('id') id: string) {
    return this.providersService.healthCheck(id);
  }
}
