export interface ChatMessageInput {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionRequest {
  apiKey: string;
  model: string;
  messages: ChatMessageInput[];
}

export interface ChatCompletionResult {
  content: string;
  tokensUsed?: number;
}

export interface AIProviderAdapter {
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResult>;
}
