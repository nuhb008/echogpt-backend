import { Module } from '@nestjs/common';
import { ClaudeAdapter } from './adapters/claude.adapter.js';
import { GeminiAdapter } from './adapters/gemini.adapter.js';
import { OpenAiAdapter } from './adapters/openai.adapter.js';
import { ProvidersController } from './providers.controller.js';
import { ProvidersService } from './providers.service.js';

@Module({
  controllers: [ProvidersController],
  providers: [ProvidersService, OpenAiAdapter, ClaudeAdapter, GeminiAdapter],
  exports: [ProvidersService],
})
export class ProvidersModule {}
