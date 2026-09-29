import { Injectable, NotFoundException } from '@nestjs/common';
import { MessageRole, RoleName } from '../common/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { ChatMessageInput } from '../providers/interfaces/ai-provider.interface.js';
import { ProvidersService } from '../providers/providers.service.js';
import { SubscriptionsService } from '../subscriptions/subscriptions.service.js';
import type { SendMessageDto } from './dto/send-message.dto.js';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly providersService: ProvidersService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  listConversations(userId: string) {
    return this.prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, createdAt: true, updatedAt: true },
    });
  }

  async getConversation(userId: string, conversationId: string) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });

    if (!conversation || conversation.userId !== userId) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async sendMessage(userId: string, dto: SendMessageDto, role: RoleName) {
    if (role !== RoleName.ADMIN) {
      await this.subscriptionsService.assertWithinUsageLimit(userId);
    }

    const conversation = dto.conversationId
      ? await this.getConversation(userId, dto.conversationId)
      : await this.prisma.conversation.create({
          data: { userId, title: dto.content.slice(0, 60) },
          include: { messages: { orderBy: { createdAt: 'asc' } } },
        });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: MessageRole.USER,
        content: dto.content,
      },
    });

    const history: ChatMessageInput[] = [
      ...conversation.messages.map((message) => ({
        role: message.role.toLowerCase() as ChatMessageInput['role'],
        content: message.content,
      })),
      { role: 'user', content: dto.content },
    ];

    let statusCode = 200;

    try {
      const result = await this.providersService.complete(dto.providerId, history);

      const assistantMessage = await this.prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: MessageRole.ASSISTANT,
          content: result.content,
          provider: result.provider,
          model: result.model,
        },
      });

      await this.prisma.conversation.update({
        where: { id: conversation.id },
        data: { updatedAt: new Date() },
      });

      await this.prisma.usageLog.create({
        data: {
          userId,
          endpoint: 'chat.sendMessage',
          provider: result.provider,
          model: result.model,
          tokensUsed: result.tokensUsed,
          statusCode,
        },
      });

      return { conversationId: conversation.id, message: assistantMessage };
    } catch (error) {
      statusCode = 502;

      await this.prisma.usageLog.create({
        data: { userId, endpoint: 'chat.sendMessage', statusCode },
      });

      throw error;
    }
  }

  async deleteConversation(userId: string, conversationId: string) {
    await this.getConversation(userId, conversationId);
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { success: true };
  }
}
