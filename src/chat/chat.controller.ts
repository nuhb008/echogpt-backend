import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import { ChatService } from './chat.service.js';
import { SendMessageDto } from './dto/send-message.dto.js';

@ApiBearerAuth()
@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @ApiOperation({ summary: "List the current user's conversations" })
  @ApiResponse({ status: 200, description: 'Conversations returned' })
  @Get('conversations')
  listConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.chatService.listConversations(user.id);
  }

  @ApiOperation({ summary: 'Get a conversation and its full message history' })
  @ApiResponse({ status: 200, description: 'Conversation returned' })
  @ApiResponse({ status: 404, description: "Conversation not found or doesn't belong to the caller" })
  @Get('conversations/:id')
  getConversation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chatService.getConversation(user.id, id);
  }

  @ApiOperation({ summary: 'Delete a conversation and its messages' })
  @ApiResponse({ status: 200, description: 'Conversation deleted' })
  @ApiResponse({ status: 404, description: "Conversation not found or doesn't belong to the caller" })
  @Delete('conversations/:id')
  deleteConversation(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.chatService.deleteConversation(user.id, id);
  }

  @ApiOperation({
    summary: 'Send a prompt to an AI provider',
    description:
      'Creates a new conversation if conversationId is omitted, or appends to an existing one. ' +
      'Non-admin users are limited by their subscription plan\'s monthly request count.',
  })
  @ApiResponse({ status: 201, description: 'Assistant reply returned' })
  @ApiResponse({ status: 404, description: "Conversation or provider not found, or no default provider configured" })
  @ApiResponse({ status: 429, description: 'Monthly request limit reached for the current plan' })
  @ApiResponse({ status: 502, description: 'The upstream AI provider request failed' })
  @Post('messages')
  sendMessage(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.id, dto, user.role.name);
  }
}
