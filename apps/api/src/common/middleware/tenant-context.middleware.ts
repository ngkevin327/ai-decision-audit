import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthResolverService } from '../../auth/auth-resolver.service';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  constructor(
    private readonly authResolver: AuthResolverService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    if (this.isPublicPath(req.path)) {
      return next();
    }

    try {
      const context = await this.authResolver.resolve(req);
      return this.tenantContext.run(context, () => next());
    } catch {
      throw new UnauthorizedException('Invalid or missing authentication');
    }
  }

  private isPublicPath(path: string): boolean {
    return path === '/health' || path.startsWith('/health/') || path.startsWith('/public');
  }
}
