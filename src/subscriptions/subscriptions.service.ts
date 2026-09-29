import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

  /** Called on registration so every user has a plan; failures are swallowed (FREE plan may not be seeded yet). */
  async provisionDefaultPlan(userId: string) {
    const freePlan = await this.prisma.subscriptionPlan.findUnique({ where: { name: 'FREE' } });

    if (!freePlan) {
      return;
    }

    await this.prisma.subscription.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        planId: freePlan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date(),
      },
    });
  }

  async changePlan(userId: string, planId: string, direction: 'upgrade' | 'downgrade') {
    const newPlan = await this.getPlanOrThrow(planId);
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new NotFoundException('No active subscription found');
    }

    const currentPrice = Number(subscription.plan.price);
    const newPrice = Number(newPlan.price);

    if (direction === 'upgrade' && newPrice <= currentPrice) {
      throw new BadRequestException(`'${newPlan.name}' is not more expensive than the current plan`);
    }

    if (direction === 'downgrade' && newPrice >= currentPrice) {
      throw new BadRequestException(`'${newPlan.name}' is not cheaper than the current plan`);
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: { planId: newPlan.id },
      include: { plan: true },
    });
  }

  async getUsage(userId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
      include: { plan: true },
    });

    if (!subscription || subscription.status !== SubscriptionStatus.ACTIVE) {
      throw new NotFoundException('No active subscription found');
    }

    const periodStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1));
    const periodEnd = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, 1));

    const used = await this.prisma.usageLog.count({
      where: {
        userId,
        endpoint: 'chat.sendMessage',
        createdAt: { gte: periodStart, lt: periodEnd },
      },
    });

    return {
      plan: subscription.plan.name,
      limit: subscription.plan.monthlyLimit,
      used,
      remaining: Math.max(0, subscription.plan.monthlyLimit - used),
      periodStart,
      periodEnd,
    };
  }

  /** Throws 429 once the user's monthly AI request limit is reached; called by ChatService before each provider call. */
  async assertWithinUsageLimit(userId: string) {
    const usage = await this.getUsage(userId).catch(() => null);

    if (usage && usage.remaining <= 0) {
      throw new HttpException(
        `Monthly request limit of ${usage.limit} reached for the ${usage.plan} plan`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async getPlanOrThrow(id: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id } });

    if (!plan) {
      throw new NotFoundException('Subscription plan not found');
    }

    return plan;
  }
}
