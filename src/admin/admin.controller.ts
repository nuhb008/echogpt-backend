import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/index.js';
import { UsersService } from '../users/users.service.js';
import { AdminService } from './admin.service.js';
import { SetRoleDto } from './dto/set-role.dto.js';
import { SetSubscriptionStatusDto } from './dto/set-subscription-status.dto.js';

@ApiBearerAuth()
@ApiTags('admin')
@Roles(RoleName.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('system-health')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @Get('usage-logs')
  listUsageLogs(@Query('take') take?: string) {
    return this.adminService.listUsageLogs(take ? Number(take) : undefined);
  }

  @Get('users')
  listUsers() {
    return this.usersService.findAll();
  }

  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Patch('users/:id/role')
  setUserRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.usersService.setRole(id, dto.role);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Get('subscriptions')
  listSubscriptions() {
    return this.adminService.listSubscriptions();
  }

  @Patch('subscriptions/:userId/status')
  setSubscriptionStatus(
    @Param('userId') userId: string,
    @Body() dto: SetSubscriptionStatusDto,
  ) {
    return this.adminService.setSubscriptionStatus(userId, dto.status);
  }
}
