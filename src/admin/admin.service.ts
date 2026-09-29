import { Injectable, NotFoundException } from '@nestjs/common';
import { SubscriptionStatus } from '../common/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
  private readonly startedAt = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [userCount, activeSubscriptions, conversationCount, providerCount] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.subscription.count({ where: { status: SubscriptionStatus.ACTIVE } }),
      this.prisma.conversation.count(),
      this.prisma.aIProvider.count({ where: { enabled: true } }),
    ]);

    return { userCount, activeSubscriptions, conversationCount, providerCount };
  }

  listUsageLogs(take = 100) {
    return this.prisma.usageLog.findMany({
      orderBy: { createdAt: 'desc' },
      take,
      include: { user: { select: { id: true, email: true } } },
    });
  }

  listSubscriptions() {
    return this.prisma.subscription.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        plan: true,
        user: { select: { id: true, email: true, name: true } },
      },
    });
  }

  async setSubscriptionStatus(userId: string, status: SubscriptionStatus) {
    const subscription = await this.prisma.subscription.findUnique({ where: { userId } });

    if (!subscription) {
      throw new NotFoundException('User has no subscription');
    }

    return this.prisma.subscription.update({
      where: { userId },
      data: {
        status,
        endDate: status === SubscriptionStatus.ACTIVE ? null : new Date(),
      },
      include: { plan: true },
    });
  }

  async getSystemHealth() {
    const dbStart = Date.now();
    let database: 'up' | 'down' = 'up';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    const memory = process.memoryUsage();

    return {
      status: database === 'up' ? 'ok' : 'error',
      uptimeSeconds: Math.round((Date.now() - this.startedAt) / 1000),
      database,
      databaseLatencyMs: Date.now() - dbStart,
      memory: {
        rssMb: Math.round(memory.rss / 1024 / 1024),
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
      },
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
  }
}
