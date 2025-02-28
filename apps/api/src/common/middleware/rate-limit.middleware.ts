import { HttpException, HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { TenantContextService } from '../tenant/tenant-context.service';

interface BucketState {
  tokens: number;
  lastRefill: number;
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly buckets = new Map<string, BucketState>();
  private readonly capacity = 120;
  private readonly refillPerSecond = 2;

  constructor(private readonly tenantContext: TenantContextService) {}

  use(req: Request, res: Response, next: NextFunction) {
    if (!req.path.startsWith('/v1/traces') || req.method !== 'POST') {
      return next();
    }

    const ctx = this.tenantContext.get();
    const key = ctx?.apiKeyId ?? req.ip ?? 'anonymous';
    const allowed = this.consume(key);

    if (!allowed) {
      res.setHeader('Retry-After', '1');
      throw new HttpException(
        { message: 'Rate limit exceeded', code: 'RATE_LIMITED' },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return next();
  }

  private consume(key: string): boolean {
    const now = Date.now();
    const bucket = this.buckets.get(key) ?? { tokens: this.capacity, lastRefill: now };
    const elapsedSeconds = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(this.capacity, bucket.tokens + elapsedSeconds * this.refillPerSecond);
    bucket.lastRefill = now;

    if (bucket.tokens < 1) {
      this.buckets.set(key, bucket);
      return false;
    }

    bucket.tokens -= 1;
    this.buckets.set(key, bucket);
    return true;
  }
}
