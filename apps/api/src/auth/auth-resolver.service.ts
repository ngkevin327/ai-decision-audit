import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { TenantContext } from '../common/tenant/tenant-context';
import { AppConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkAuthService } from './clerk-auth.service';
import { roleToScopes } from './permission.constants';

@Injectable()
export class AuthResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    private readonly clerk: ClerkAuthService,
    @Inject(forwardRef(() => ApiKeysService))
    private readonly apiKeys: ApiKeysService,
  ) {}

  async resolve(req: Request): Promise<TenantContext> {
    const apiKeyHeader = req.header('x-api-key') ?? req.header('authorization');
    if (apiKeyHeader?.startsWith('at_') || apiKeyHeader?.startsWith('Bearer at_')) {
      const rawKey = apiKeyHeader.replace(/^Bearer\s+/i, '').trim();
      return this.resolveApiKey(rawKey);
    }

    const bearer = extractBearer(req.header('authorization'));
    if (bearer) {
      return this.resolveClerkBearer(bearer, req.header('x-organization-id'));
    }

    if (this.config.clerkEnabled) {
      throw new UnauthorizedException('Clerk session token required');
    }

    const userExternalId = req.header('x-user-id');
    const orgId = req.header('x-organization-id');
    if (userExternalId && orgId) {
      return this.resolveJwtHeaders(userExternalId, orgId);
    }

    throw new UnauthorizedException('Authentication required');
  }

  private async resolveClerkBearer(
    token: string,
    organizationId: string | undefined,
  ): Promise<TenantContext> {
    const verified = await this.clerk.verifyBearerToken(token);
    if (!organizationId) {
      throw new UnauthorizedException('X-Organization-Id header is required');
    }
    return this.resolveJwtHeaders(verified.externalUserId, organizationId);
  }

  private async resolveApiKey(rawKey: string): Promise<TenantContext> {
    const record = await this.apiKeys.validate(rawKey);

    if (!record) {
      throw new UnauthorizedException('Invalid API key');
    }

    return {
      authMethod: 'api_key',
      organizationId: record.organizationId,
      projectId: record.projectId,
      environmentId: record.environmentId ?? undefined,
      scopes: record.scopes,
      apiKeyId: record.id,
    };
  }

  private async resolveJwtHeaders(
    externalUserId: string,
    organizationId: string,
  ): Promise<TenantContext> {
    const user = await this.prisma.user.findUnique({
      where: { externalId: externalUserId },
    });
    if (!user) {
      throw new UnauthorizedException(
        'User not found — sign in and call POST /public/auth/session or complete onboarding',
      );
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        organizationId_userId: { organizationId, userId: user.id },
      },
    });

    if (!membership || !membership.acceptedAt) {
      throw new UnauthorizedException('Not a member of this organization');
    }

    return {
      authMethod: 'jwt',
      organizationId,
      userId: user.id,
      role: membership.role,
      scopes: roleToScopes(membership.role),
    };
  }
}

function extractBearer(authorization: string | undefined): string | null {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice(7).trim();
  if (!token || token.startsWith('at_')) return null;
  return token;
}
