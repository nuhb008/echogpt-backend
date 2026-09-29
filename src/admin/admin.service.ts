import { Injectable } from '@nestjs/common';
import { SubscriptionStatus } from '../common/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AdminService {
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
}
