import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator.js';
import { HealthService } from './health.service.js';

@ApiTags('Health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @ApiOperation({ summary: 'Public liveness/readiness check for the API and its database connection' })
  @ApiResponse({ status: 200, description: '{ status, database, timestamp }' })
  @Get()
  check() {
    return this.healthService.check();
  }
}
