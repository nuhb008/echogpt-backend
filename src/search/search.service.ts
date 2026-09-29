import { BadGatewayException, Injectable } from '@nestjs/common';
import type { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { SearchQueryDto } from './dto/search-query.dto.js';

interface DuckDuckGoResponse {
  Heading?: string;
  AbstractText?: string;
  AbstractURL?: string;
  RelatedTopics?: Array<{ Text?: string; FirstURL?: string }>;
}

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(userId: string, dto: SearchQueryDto) {
    const url = new URL('https://api.duckduckgo.com/');
    url.searchParams.set('q', dto.query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('no_html', '1');
    url.searchParams.set('skip_disambig', '1');

    let statusCode = 200;
    const results: SearchResultItem[] = [];

    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10_000) });

      // DuckDuckGo answers 202 with a non-JSON body when it rate-limits, so only 200 counts.
      if (response.status !== 200) {
        throw new Error(`upstream responded with status ${response.status}`);
      }

      const data = (await response.json()) as DuckDuckGoResponse;

      if (data.AbstractText) {
        results.push({
          title: data.Heading ?? dto.query,
          url: data.AbstractURL ?? '',
          snippet: data.AbstractText,
        });
      }

      for (const topic of data.RelatedTopics ?? []) {
        if (topic.Text && topic.FirstURL) {
          results.push({ title: topic.Text, url: topic.FirstURL, snippet: topic.Text });
        }
      }

      await this.prisma.webSearch.create({
        data: { userId, query: dto.query, results: results as unknown as Prisma.InputJsonValue },
      });

      return { query: dto.query, results };
    } catch (error) {
      statusCode = 502;
      throw new BadGatewayException(
        `Search provider request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      await this.prisma.usageLog.create({
        data: { userId, endpoint: 'search.search', statusCode },
      });
    }
  }

  history(userId: string) {
    return this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async recent(userId: string, take = 10) {
    // distinct requires the DISTINCT ON column(s) to be first in orderBy
    const searches = await this.prisma.webSearch.findMany({
      where: { userId },
      distinct: ['query'],
      orderBy: { createdAt: 'desc' },
      take,
      select: { query: true, createdAt: true },
    });

    return searches;
  }

  async suggestions(userId: string, query: string) {
    const [ownHistory, external] = await Promise.all([
      this.prisma.webSearch.findMany({
        where: { userId, query: { contains: query, mode: 'insensitive' } },
        distinct: ['query'],
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { query: true },
      }),
      this.fetchExternalSuggestions(query),
    ]);

    const suggestions = new Set<string>([
      ...ownHistory.map((entry) => entry.query),
      ...external,
    ]);

    return { query, suggestions: [...suggestions].slice(0, 10) };
  }

  private async fetchExternalSuggestions(query: string): Promise<string[]> {
    try {
      const url = new URL('https://ac.duckduckgo.com/ac/');
      url.searchParams.set('q', query);
      url.searchParams.set('type', 'list');

      const response = await fetch(url, { signal: AbortSignal.timeout(5_000) });

      if (!response.ok) {
        return [];
      }

      // "list" format: [query, [suggestion1, suggestion2, ...]]
      const [, phrases] = (await response.json()) as [string, string[]];
      return phrases ?? [];
    } catch {
      return [];
    }
  }
}
