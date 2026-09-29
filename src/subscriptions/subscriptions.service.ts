import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '../common/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreatePlanDto } from './dto/create-plan.dto.js';
import type { SubscribeDto } from './dto/subscribe.dto.js';
import type { UpdatePlanDto } from './dto/update-plan.dto.js';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
  }

  createPlan(dto: CreatePlanDto) {
    return this.prisma.subscriptionPlan.create({ data: dto });
  }

  async updatePlan(id: string, dto: UpdatePlanDto) {
    await this.getPlanOrThrow(id);
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  async removePlan(id: string) {
    await this.getPlanOrThrow(id);
    await this.prisma.subscriptionPlan.delete({ where: { id } });
    return { success: true };
  }

  async getMySubscription(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return subscription;
  }

  async subscribe(userId: string, dto: SubscribeDto) {
    await this.getPlanOrThrow(dto.planId);

    const existing = await this.prisma.subscription.findUnique({ where: { userId } });

    if (existing) {
      throw new ConflictException('User already has a subscription');
    }

    return this.prisma.subscription.create({
      data: {
        userId,
        planId: dto.planId,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
      },
      include: { plan: true },
    });
  }

  async cancel(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: { status: SubscriptionStatus.CANCELLED, endDate: new Date() },
    });
  }

  private async getPlanOrThrow(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }
}
