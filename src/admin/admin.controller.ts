import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/index.js';
import { AdminService } from './admin.service.js';

@ApiBearerAuth()
@ApiTags('admin')
@Roles(RoleName.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('usage-logs')
  listUsageLogs(@Query('take') take?: string) {
    return this.adminService.listUsageLogs(take ? Number(take) : undefined);
  }
}
