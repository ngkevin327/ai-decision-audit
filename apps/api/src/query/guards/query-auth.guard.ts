import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { API_SCOPES, ROLE_PERMISSIONS } from '../../auth/permission.constants';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

@Injectable()
export class QueryAuthGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(_context: ExecutionContext): boolean {
    const ctx = this.tenantContext.require();

    if (ctx.authMethod === 'api_key') {
      if (!ctx.scopes.includes(API_SCOPES.TRACE_READ)) {
        throw new ForbiddenException('API key missing trace:read scope');
      }
      return true;
    }

    if (ctx.authMethod === 'jwt' && ctx.role) {
      if (!ROLE_PERMISSIONS[ctx.role].search) {
        throw new ForbiddenException('Role does not allow trace search');
      }
      return true;
    }

    throw new ForbiddenException('Trace query requires a valid API key or session');
  }
}
