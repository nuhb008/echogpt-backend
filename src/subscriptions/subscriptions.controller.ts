import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { Public } from '../common/decorators/public.decorator.js';
import { Roles } from '../common/decorators/roles.decorator.js';
import { RoleName } from '../common/enums/index.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { ChangePlanDto } from './dto/change-plan.dto.js';
import { CreatePlanDto } from './dto/create-plan.dto.js';
import { SubscribeDto } from './dto/subscribe.dto.js';
import { UpdatePlanDto } from './dto/update-plan.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@ApiBearerAuth()
@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @ApiOperation({ summary: 'List available subscription plans (public)' })
  @ApiResponse({ status: 200, description: 'Plans returned' })
  @Public()
  @Get('plans')
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @ApiOperation({ summary: 'Create a subscription plan (admin only)' })
  @ApiResponse({ status: 201, description: 'Plan created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @Roles(RoleName.ADMIN)
  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @ApiOperation({ summary: 'Update a subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan updated' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Roles(RoleName.ADMIN)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @ApiOperation({ summary: 'Delete a subscription plan (admin only)' })
  @ApiResponse({ status: 200, description: 'Plan deleted' })
  @ApiResponse({ status: 403, description: 'Caller is not an admin' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @Roles(RoleName.ADMIN)
  @Delete('plans/:id')
  removePlan(@Param('id') id: string) {
    return this.subscriptionsService.removePlan(id);
  }

  @ApiOperation({ summary: "Get the current user's subscription" })
  @ApiResponse({ status: 200, description: 'Subscription returned' })
  @ApiResponse({ status: 404, description: 'No active subscription' })
  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @ApiOperation({ summary: 'Subscribe to a plan (fails if already subscribed)' })
  @ApiResponse({ status: 201, description: 'Subscribed' })
  @ApiResponse({ status: 404, description: 'Plan not found' })
  @ApiResponse({ status: 409, description: 'User already has a subscription' })
  @Post('subscribe')
  subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(user.id, dto);
  }

  @ApiOperation({ summary: "Cancel the current user's subscription" })
  @ApiResponse({ status: 201, description: 'Subscription cancelled' })
  @ApiResponse({ status: 404, description: 'No active subscription' })
  @Post('cancel')
  cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.cancel(user.id);
  }

  @ApiOperation({ summary: "Get the current user's monthly AI request usage vs. their plan limit" })
  @ApiResponse({ status: 200, description: 'Usage returned' })
  @ApiResponse({ status: 404, description: 'No active subscription' })
  @Get('usage')
  getUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getUsage(user.id);
  }

  @ApiOperation({ summary: 'Move to a more expensive plan' })
  @ApiResponse({ status: 201, description: 'Plan upgraded' })
  @ApiResponse({ status: 400, description: 'Target plan is not more expensive than the current one' })
  @ApiResponse({ status: 404, description: 'No active subscription, or plan not found' })
  @Post('upgrade')
  upgrade(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePlanDto) {
    return this.subscriptionsService.changePlan(user.id, dto.planId, 'upgrade');
  }

  @ApiOperation({ summary: 'Move to a cheaper plan' })
  @ApiResponse({ status: 201, description: 'Plan downgraded' })
  @ApiResponse({ status: 400, description: 'Target plan is not cheaper than the current one' })
  @ApiResponse({ status: 404, description: 'No active subscription, or plan not found' })
  @Post('downgrade')
  downgrade(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePlanDto) {
    return this.subscriptionsService.changePlan(user.id, dto.planId, 'downgrade');
  }
}
