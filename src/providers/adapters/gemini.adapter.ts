import { Injectable } from '@nestjs/common';
import type {
  AIProviderAdapter,
  ChatCompletionRequest,
  ChatCompletionResult,
} from '../interfaces/ai-provider.interface.js';

interface GeminiGenerateContentResponse {
  candidates: Array<{ content: { parts: Array<{ text?: string }> } }>;
  usageMetadata?: { totalTokenCount?: number };
}

@Injectable()
export class GeminiAdapter implements AIProviderAdapter {
  async complete({ apiKey, model, messages }: ChatCompletionRequest): Promise<ChatCompletionResult> {
    const systemMessage = messages.find((message) => message.role === 'system')?.content;

    const contents = messages
      .filter((message) => message.role !== 'system')
      .map((message) => ({
        role: message.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: message.content }],
      }));

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          ...(systemMessage ? { systemInstruction: { parts: [{ text: systemMessage }] } } : {}),
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini request failed (${response.status}): ${errorBody}`);
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;

    const content =
      data.candidates[0]?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';

    return { content, tokensUsed: data.usageMetadata?.totalTokenCount };
  }
}
