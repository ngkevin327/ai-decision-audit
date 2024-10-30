import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { Request } from 'express';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { MetaAuditService } from './meta-audit.service';

const AUDITED_ACTIONS: Record<string, { action: string; resourceType: string }> = {
  'POST /organizations/:orgId/api-keys': { action: 'api_key.created', resourceType: 'api_key' },
  'DELETE /organizations/:orgId/api-keys/:keyId': {
    action: 'api_key.revoked',
    resourceType: 'api_key',
  },
  'POST /organizations/:orgId/members/invite': {
    action: 'member.invited',
    resourceType: 'membership',
  },
  'PATCH /organizations/:orgId/members/:membershipId/role': {
    action: 'member.role_changed',
    resourceType: 'membership',
  },
};

@Injectable()
export class MetaAuditInterceptor implements NestInterceptor {
  constructor(
    private readonly metaAudit: MetaAuditService,
    private readonly tenantContext: TenantContextService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const routeKey = `${req.method} ${req.route?.path ?? req.path}`;
    const auditConfig = this.matchAuditConfig(routeKey, req);

    return next.handle().pipe(
      tap(async (responseBody) => {
        if (!auditConfig) return;
        const ctx = this.tenantContext.get();
        if (!ctx?.organizationId) return;

        await this.metaAudit.record({
          organizationId: ctx.organizationId,
          actorUserId: ctx.userId,
          action: auditConfig.action,
          resourceType: auditConfig.resourceType,
          resourceId: this.extractResourceId(responseBody, req),
          metadata: { method: req.method, path: req.path },
        });
      }),
    );
  }

  private matchAuditConfig(routeKey: string, req: Request) {
    for (const [pattern, config] of Object.entries(AUDITED_ACTIONS)) {
      if (routeKey.includes(pattern.split(' ')[1].split('/')[1])) {
        if (req.method === pattern.split(' ')[0]) {
          return config;
        }
      }
    }
    const simplified = `${req.method} ${req.path}`;
    if (simplified.includes('/api-keys') && req.method === 'POST') {
      return AUDITED_ACTIONS['POST /organizations/:orgId/api-keys'];
    }
    if (simplified.includes('/api-keys') && req.method === 'DELETE') {
      return AUDITED_ACTIONS['DELETE /organizations/:orgId/api-keys/:keyId'];
    }
    if (simplified.includes('/members/invite')) {
      return AUDITED_ACTIONS['POST /organizations/:orgId/members/invite'];
    }
    if (simplified.includes('/role')) {
      return AUDITED_ACTIONS['PATCH /organizations/:orgId/members/:membershipId/role'];
    }
    return undefined;
  }

  private extractResourceId(body: unknown, req: Request): string | undefined {
    if (body && typeof body === 'object' && 'id' in body) {
      return String((body as { id: string }).id);
    }
    const keyId = req.params.keyId;
    const membershipId = req.params.membershipId;
    return typeof keyId === 'string'
      ? keyId
      : typeof membershipId === 'string'
        ? membershipId
        : undefined;
  }
}
