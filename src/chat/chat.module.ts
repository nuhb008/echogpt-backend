import { Module } from '@nestjs/common';
import { ProvidersModule } from '../providers/providers.module.js';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module.js';
import { ChatController } from './chat.controller.js';
import { ChatService } from './chat.service.js';

@Module({
  imports: [ProvidersModule, SubscriptionsModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
