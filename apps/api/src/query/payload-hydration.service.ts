import { Inject, Injectable, Logger } from '@nestjs/common';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.interface';

const REQUEST_CACHE_MAX = 128;

@Injectable()
export class PayloadHydrationService {
  private readonly logger = new Logger(PayloadHydrationService.name);

  constructor(@Inject(STORAGE_SERVICE) private readonly storage: StorageService) {}

  async hydratePayload(
    payloadRef: string | null,
    cache: Map<string, unknown>,
  ): Promise<unknown | null> {
    if (!payloadRef) {
      return null;
    }

    const cached = cache.get(payloadRef);
    if (cached !== undefined) {
      return cached;
    }

    try {
      const object = await this.storage.get(payloadRef);
      const parsed = JSON.parse(object.body.toString('utf8')) as unknown;
      this.storeInCache(cache, payloadRef, parsed);
      return parsed;
    } catch (error) {
      this.logger.warn('payload hydration failed', {
        payloadRef,
        error: error instanceof Error ? error.message : 'unknown',
      });
      return null;
    }
  }

  createRequestCache(): Map<string, unknown> {
    return new Map();
  }

  private storeInCache(cache: Map<string, unknown>, key: string, value: unknown): void {
    if (cache.size >= REQUEST_CACHE_MAX) {
      const oldest = cache.keys().next().value;
      if (oldest) {
        cache.delete(oldest);
      }
    }
    cache.set(key, value);
  }
}
