import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
@ApiTags('subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Roles(RoleName.ADMIN)
  @Post('plans')
  createPlan(@Body() dto: CreatePlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Roles(RoleName.ADMIN)
  @Patch('plans/:id')
  updatePlan(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Roles(RoleName.ADMIN)
  @Delete('plans/:id')
  removePlan(@Param('id') id: string) {
    return this.subscriptionsService.removePlan(id);
  }

  @Get('me')
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getMySubscription(user.id);
  }

  @Post('subscribe')
  subscribe(@CurrentUser() user: AuthenticatedUser, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(user.id, dto);
  }

  @Post('cancel')
  cancel(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.cancel(user.id);
  }

  @Get('usage')
  getUsage(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionsService.getUsage(user.id);
  }

  @Post('upgrade')
  upgrade(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePlanDto) {
    return this.subscriptionsService.changePlan(user.id, dto.planId, 'upgrade');
  }

  @Post('downgrade')
  downgrade(@CurrentUser() user: AuthenticatedUser, @Body() dto: ChangePlanDto) {
    return this.subscriptionsService.changePlan(user.id, dto.planId, 'downgrade');
  }
}
