import {
  BadGatewayException,
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { ProviderType } from '../common/enums/index.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ClaudeAdapter } from './adapters/claude.adapter.js';
import { GeminiAdapter } from './adapters/gemini.adapter.js';
import { OpenAiAdapter } from './adapters/openai.adapter.js';
import type { CreateProviderDto } from './dto/create-provider.dto.js';
import type { UpdateProviderDto } from './dto/update-provider.dto.js';
import type { AIProviderAdapter, ChatMessageInput } from './interfaces/ai-provider.interface.js';

const ALGORITHM = 'aes-256-gcm';

@Injectable()
export class ProvidersService {
  private readonly adapters: Record<ProviderType, AIProviderAdapter>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    openAiAdapter: OpenAiAdapter,
    claudeAdapter: ClaudeAdapter,
    geminiAdapter: GeminiAdapter,
  ) {
    this.adapters = {
      [ProviderType.OPENAI]: openAiAdapter,
      [ProviderType.ANTHROPIC]: claudeAdapter,
      [ProviderType.GEMINI]: geminiAdapter,
    };
  }

  findAll() {
    return this.prisma.aIProvider.findMany({
      select: {
        id: true,
        name: true,
        model: true,
        enabled: true,
        isDefault: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(dto: CreateProviderDto) {
    if (dto.isDefault) {
      await this.clearDefault();
    }

    return this.prisma.aIProvider.create({
      data: {
        name: dto.name,
        model: dto.model,
        apiKeyEncrypted: this.encrypt(dto.apiKey),
        enabled: dto.enabled ?? true,
        isDefault: dto.isDefault ?? false,
      },
      select: { id: true, name: true, model: true, enabled: true, isDefault: true },
    });
  }

  async update(id: string, dto: UpdateProviderDto) {
    await this.getProviderOrThrow(id);

    if (dto.isDefault) {
      await this.clearDefault();
    }

    return this.prisma.aIProvider.update({
      where: { id },
      data: {
        ...(dto.model !== undefined ? { model: dto.model } : {}),
        ...(dto.apiKey !== undefined ? { apiKeyEncrypted: this.encrypt(dto.apiKey) } : {}),
        ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
        ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      },
      select: { id: true, name: true, model: true, enabled: true, isDefault: true },
    });
  }

  async remove(id: string) {
    await this.getProviderOrThrow(id);
    await this.prisma.aIProvider.delete({ where: { id } });
    return { success: true };
  }

  async getDefaultProvider() {
    const provider = await this.prisma.aIProvider.findFirst({
      where: { isDefault: true, enabled: true },
    });

    if (!provider) {
      throw new NotFoundException('No default AI provider is configured');
    }

    return provider;
  }

  async complete(providerId: string | undefined, messages: ChatMessageInput[]) {
    const provider = providerId
      ? await this.getProviderOrThrow(providerId)
      : await this.getDefaultProvider();

    if (!provider.enabled) {
      throw new BadRequestException('Selected AI provider is disabled');
    }

    const adapter = this.adapters[provider.name];
    const apiKey = this.decrypt(provider.apiKeyEncrypted);

    try {
      const result = await adapter.complete({ apiKey, model: provider.model, messages });
      return { ...result, provider: provider.name, model: provider.model };
    } catch (error) {
      throw new BadGatewayException(
        `${provider.name} request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  async healthCheck(id: string) {
    const provider = await this.getProviderOrThrow(id);
    const adapter = this.adapters[provider.name];
    const apiKey = this.decrypt(provider.apiKeyEncrypted);
    const startedAt = Date.now();

    try {
      await adapter.complete({
        apiKey,
        model: provider.model,
        messages: [{ role: 'user', content: 'ping' }],
      });

      return { healthy: true, latencyMs: Date.now() - startedAt };
    } catch (error) {
      return {
        healthy: false,
        latencyMs: Date.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private async getProviderOrThrow(id: string) {
    const provider = await this.prisma.aIProvider.findUnique({ where: { id } });

    if (!provider) {
      throw new NotFoundException('AI provider not found');
    }

    return provider;
  }

  private async clearDefault() {
    await this.prisma.aIProvider.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  private getEncryptionKey(): Buffer {
    const key = this.configService.get<string>('ENCRYPTION_KEY');

    if (!key || key.length !== 64) {
      throw new Error('ENCRYPTION_KEY must be a 64-character hex string (32 bytes)');
    }

    return Buffer.from(key, 'hex');
  }

  private encrypt(value: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv(ALGORITHM, this.getEncryptionKey(), iv);
    const encrypted = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [iv.toString('hex'), authTag.toString('hex'), encrypted.toString('hex')].join(':');
  }

  private decrypt(value: string): string {
    const [ivHex, authTagHex, dataHex] = value.split(':');
    const decipher = createDecipheriv(ALGORITHM, this.getEncryptionKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

    return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString(
      'utf8',
    );
  }
}
