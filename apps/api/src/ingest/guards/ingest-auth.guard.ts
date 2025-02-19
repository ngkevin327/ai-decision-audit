import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { API_SCOPES } from '../../auth/permission.constants';
import { TenantContextService } from '../../common/tenant/tenant-context.service';

@Injectable()
export class IngestAuthGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(_context: ExecutionContext): boolean {
    const ctx = this.tenantContext.require();

    if (ctx.authMethod !== 'api_key') {
      throw new ForbiddenException('Trace ingest requires an API key');
    }

    if (!ctx.scopes.includes(API_SCOPES.TRACE_INGEST)) {
      throw new ForbiddenException('API key missing trace:ingest scope');
    }

    if (!ctx.projectId) {
      throw new ForbiddenException('API key must be scoped to a project');
    }

    return true;
  }
}
