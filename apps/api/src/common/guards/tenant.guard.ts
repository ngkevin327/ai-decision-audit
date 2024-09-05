import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { TenantContextService } from '../tenant/tenant-context.service';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(_context: ExecutionContext): boolean {
    const ctx = this.tenantContext.get();
    if (!ctx?.organizationId) {
      throw new UnauthorizedException('Tenant context required');
    }
    return true;
  }
}
