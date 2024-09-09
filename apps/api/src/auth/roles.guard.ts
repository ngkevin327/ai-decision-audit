import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY, SCOPES_KEY } from './permissions.decorator';
import { TenantContextService } from '../common/tenant/tenant-context.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tenantContext: TenantContextService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const requiredScopes = this.reflector.getAllAndOverride<string[]>(SCOPES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles?.length && !requiredScopes?.length) {
      return true;
    }

    const ctx = this.tenantContext.require();

    if (ctx.authMethod === 'api_key') {
      if (requiredScopes?.length) {
        const hasScope = requiredScopes.every((s) => ctx.scopes.includes(s));
        if (!hasScope) {
          throw new ForbiddenException('API key missing required scope');
        }
      }
      return true;
    }

    if (requiredRoles?.length && ctx.role && !requiredRoles.includes(ctx.role)) {
      throw new ForbiddenException('Insufficient role');
    }

    if (requiredScopes?.length) {
      const hasScope = requiredScopes.every((s) => ctx.scopes.includes(s));
      if (!hasScope) {
        throw new ForbiddenException('Insufficient permissions');
      }
    }

    return true;
  }
}
