import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class TenantScopeGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { tenantMismatch?: boolean }>();
    const routeOrgId = req.params.orgId;
    if (!routeOrgId) {
      return true;
    }

    const ctx = this.tenantContext.get();
    if (!ctx) {
      return true;
    }

    if (ctx.organizationId !== routeOrgId) {
      req.tenantMismatch = true;
      throw new ForbiddenException('Resource belongs to another organization');
    }

    return true;
  }
}
