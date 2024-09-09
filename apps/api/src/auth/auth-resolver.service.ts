import { Inject, Injectable, UnauthorizedException, forwardRef } from '@nestjs/common';
import { Request } from 'express';
import { ApiKeysService } from '../api-keys/api-keys.service';
import { TenantContext } from '../common/tenant/tenant-context';
import { PrismaService } from '../prisma/prisma.service';
import { roleToScopes } from './permission.constants';

@Injectable()
export class AuthResolverService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => ApiKeysService))
    private readonly apiKeys: ApiKeysService,
  ) {}

  async resolve(req: Request): Promise<TenantContext> {
    const apiKeyHeader = req.header('x-api-key') ?? req.header('authorization');
    if (apiKeyHeader?.startsWith('at_') || apiKeyHeader?.startsWith('Bearer at_')) {
      const rawKey = apiKeyHeader.replace(/^Bearer\s+/i, '').trim();
      return this.resolveApiKey(rawKey);
    }

    const userExternalId = req.header('x-user-id');
    const orgId = req.header('x-organization-id');
    if (userExternalId && orgId) {
      return this.resolveJwtHeaders(userExternalId, orgId);
    }

    throw new UnauthorizedException('Authentication required');
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
      throw new UnauthorizedException('User not found');
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
