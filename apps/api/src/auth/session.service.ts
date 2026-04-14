import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { AppConfigService } from '../config/config.service';
import { PrismaService } from '../prisma/prisma.service';
import { ClerkAuthService, VerifiedClerkSession } from './clerk-auth.service';

export interface LinkSessionInput {
  organizationId?: string;
}

@Injectable()
export class SessionService {
  constructor(
    private readonly clerk: ClerkAuthService,
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
  ) {}

  async linkClerkUser(token: string, input: LinkSessionInput) {
    const verified = await this.clerk.verifyBearerToken(token);
    const organizationId = input.organizationId ?? this.config.localDevOrgId;
    if (!organizationId) {
      throw new BadRequestException(
        'organizationId is required (or set LOCAL_DEV_ORG_ID after pnpm bootstrap:local)',
      );
    }

    const org = await this.prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const user = await this.ensureUser(verified);

    const membership = await this.prisma.membership.upsert({
      where: {
        organizationId_userId: { organizationId: org.id, userId: user.id },
      },
      create: {
        organizationId: org.id,
        userId: user.id,
        role: Role.org_admin,
        acceptedAt: new Date(),
      },
      update: {
        acceptedAt: new Date(),
      },
    });

    return {
      organization: { id: org.id, name: org.name, slug: org.slug },
      user: {
        id: user.id,
        externalId: user.externalId,
        email: user.email,
        displayName: user.displayName,
      },
      membership: { role: membership.role },
    };
  }

  private async ensureUser(verified: VerifiedClerkSession) {
    const email =
      verified.email ?? `${verified.externalUserId.replace(/[^a-zA-Z0-9]/g, '_')}@clerk.local`;

    return this.prisma.user.upsert({
      where: { externalId: verified.externalUserId },
      update: {
        email,
        displayName: verified.displayName ?? undefined,
      },
      create: {
        externalId: verified.externalUserId,
        email,
        displayName: verified.displayName ?? undefined,
      },
    });
  }
}
