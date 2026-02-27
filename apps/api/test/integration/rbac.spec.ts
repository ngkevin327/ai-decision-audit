import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from '../../src/auth/roles.guard';
import { ROLES_KEY, SCOPES_KEY } from '../../src/auth/permissions.decorator';
import { TenantContextService } from '../../src/common/tenant/tenant-context.service';
import { ROLE_PERMISSIONS } from '../../src/auth/permission.constants';

describe('RBAC matrix', () => {
  const reflector = new Reflector();
  const tenantContext = new TenantContextService();
  const guard = new RolesGuard(reflector, tenantContext);

  function runGuard(role: Role, requiredRoles: Role[]) {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === ROLES_KEY) return requiredRoles;
      return undefined;
    });

    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    return tenantContext.run(
      {
        authMethod: 'jwt',
        organizationId: 'org-1',
        userId: 'user-1',
        role,
        scopes: [],
      },
      () => guard.canActivate(ctx),
    );
  }

  it('allows org_admin to access admin routes', () => {
    expect(runGuard(Role.org_admin, [Role.org_admin])).toBe(true);
  });

  it('blocks developer from org_admin routes', () => {
    expect(() => runGuard(Role.developer, [Role.org_admin])).toThrow(ForbiddenException);
  });

  it('blocks auditor from ingest-only operations at role level', () => {
    expect(() => runGuard(Role.auditor, [Role.org_admin, Role.developer])).toThrow(
      ForbiddenException,
    );
  });

  it('viewer cannot export per permission matrix', () => {
    expect(ROLE_PERMISSIONS.viewer.export).toBe(false);
    expect(ROLE_PERMISSIONS.auditor.export).toBe(true);
  });

  it('allows API keys with required scopes', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockImplementation((key) => {
      if (key === SCOPES_KEY) return ['trace:ingest'];
      return undefined;
    });

    const ctx = {
      getHandler: () => ({}),
      getClass: () => ({}),
    } as ExecutionContext;

    const allowed = tenantContext.run(
      {
        authMethod: 'api_key',
        organizationId: 'org-1',
        scopes: ['trace:ingest'],
      },
      () => guard.canActivate(ctx),
    );

    expect(allowed).toBe(true);
  });
});
