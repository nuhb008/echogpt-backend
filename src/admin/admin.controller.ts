import { Body, Controller, Delete, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/index.js';
import { UsersService } from '../users/users.service.js';
import { AdminService } from './admin.service.js';
import { SetRoleDto } from './dto/set-role.dto.js';
import { SetSubscriptionStatusDto } from './dto/set-subscription-status.dto.js';

@ApiBearerAuth()
@ApiTags('Admin')
@Roles(RoleName.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly usersService: UsersService,
  ) {}

  @ApiOperation({ summary: 'Dashboard statistics: user count, active subscriptions, conversations, enabled providers' })
  @ApiResponse({ status: 200, description: 'Stats returned' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @ApiOperation({ summary: 'System health: uptime, memory usage, database connectivity and latency' })
  @ApiResponse({ status: 200, description: 'Health returned' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Get('system-health')
  getSystemHealth() {
    return this.adminService.getSystemHealth();
  }

  @ApiOperation({ summary: 'List recent API usage/request logs across all users' })
  @ApiResponse({ status: 200, description: 'Usage logs returned' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Get('usage-logs')
  listUsageLogs(@Query('take') take?: string) {
    return this.adminService.listUsageLogs(take ? Number(take) : undefined);
  }

  @ApiOperation({ summary: 'List all users' })
  @ApiResponse({ status: 200, description: 'Users returned' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Get('users')
  listUsers() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Get a single user by id' })
  @ApiResponse({ status: 200, description: 'User returned' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @ApiOperation({ summary: "Promote or demote a user's role" })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin, or this would demote the last admin' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Patch('users/:id/role')
  setUserRole(@Param('id') id: string, @Body() dto: SetRoleDto) {
    return this.usersService.setRole(id, dto.role);
  }

  @ApiOperation({ summary: 'Delete any user account and its data' })
  @ApiResponse({ status: 200, description: 'User deleted' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin, or this is the last admin account' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @ApiOperation({ summary: 'List every subscription with its user and plan' })
  @ApiResponse({ status: 200, description: 'Subscriptions returned' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Get('subscriptions')
  listSubscriptions() {
    return this.adminService.listSubscriptions();
  }

  @ApiOperation({ summary: "Force-set a user's subscription status (e.g. cancel on their behalf)" })
  @ApiResponse({ status: 200, description: 'Status updated' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'User has no subscription' })
  @Patch('subscriptions/:userId/status')
  setSubscriptionStatus(
    @Param('userId') userId: string,
    @Body() dto: SetSubscriptionStatusDto,
  ) {
    return this.adminService.setSubscriptionStatus(userId, dto.status);
  }
}
