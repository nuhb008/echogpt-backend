import { Injectable } from '@nestjs/common';
import type {
  AIProviderAdapter,
  ChatCompletionRequest,
  ChatCompletionResult,
} from '../interfaces/ai-provider.interface.js';

interface OpenAiChatCompletionResponse {
  choices: Array<{ message: { content: string } }>;
  usage?: { total_tokens?: number };
}

@Injectable()
export class OpenAiAdapter implements AIProviderAdapter {
  async complete({ apiKey, model, messages }: ChatCompletionRequest): Promise<ChatCompletionResult> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`OpenAI request failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as OpenAiChatCompletionResponse;

    return {
      content: data.choices[0]?.message?.content ?? '',
      tokensUsed: data.usage?.total_tokens,
    };
  }
}
