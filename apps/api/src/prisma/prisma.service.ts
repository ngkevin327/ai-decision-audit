import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AppConfigService } from '../config/config.service';

const DEFAULT_CONNECTION_LIMIT = 20;
const DEFAULT_POOL_TIMEOUT_SECONDS = 10;

function withConnectionPool(url: string): string {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has('connection_limit')) {
      parsed.searchParams.set('connection_limit', String(DEFAULT_CONNECTION_LIMIT));
    }
    if (!parsed.searchParams.has('pool_timeout')) {
      parsed.searchParams.set('pool_timeout', String(DEFAULT_POOL_TIMEOUT_SECONDS));
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(config: AppConfigService) {
    super({
      datasources: {
        db: { url: withConnectionPool(config.databaseUrl) },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
