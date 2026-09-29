import { Injectable } from '@nestjs/common';
import type {
  AIProviderAdapter,
  ChatCompletionRequest,
  ChatCompletionResult,
} from '../interfaces/ai-provider.interface.js';

interface AnthropicMessagesResponse {
  content: Array<{ type: string; text?: string }>;
  usage?: { input_tokens?: number; output_tokens?: number };
}

@Injectable()
export class ClaudeAdapter implements AIProviderAdapter {
  async complete({ apiKey, model, messages }: ChatCompletionRequest): Promise<ChatCompletionResult> {
    const systemMessage = messages.find((message) => message.role === 'system')?.content;
    const conversation = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({ role: message.role, content: message.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        system: systemMessage,
        messages: conversation,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Anthropic request failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as AnthropicMessagesResponse;

    const content = data.content
      .filter((block) => block.type === 'text')
      .map((block) => block.text ?? '')
      .join('');

    const tokensUsed = data.usage
      ? (data.usage.input_tokens ?? 0) + (data.usage.output_tokens ?? 0)
      : undefined;

    return { content, tokensUsed };
  }
}
