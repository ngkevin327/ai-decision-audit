import { Injectable, NotFoundException } from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

export interface CreatedApiKeyResult {
  id: string;
  name: string;
  keyPrefix: string;
  projectId: string;
  scopes: string[];
  plaintextKey: string;
  createdAt: Date;
}

@Injectable()
export class ApiKeysService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async create(organizationId: string, dto: CreateApiKeyDto): Promise<CreatedApiKeyResult> {
    const ctx = this.tenantContext.require();
    const project = await this.prisma.project.findFirst({
      where: { id: dto.projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const plaintextKey = this.generateKey();
    const keyPrefix = plaintextKey.slice(0, 16);
    const keyHash = await bcrypt.hash(plaintextKey, 10);

    const record = await this.prisma.apiKey.create({
      data: {
        organizationId,
        projectId: dto.projectId,
        environmentId: dto.environmentId,
        name: dto.name,
        keyPrefix,
        keyHash,
        scopes: dto.scopes,
        createdById: ctx.userId,
      },
    });

    return {
      id: record.id,
      name: record.name,
      keyPrefix: record.keyPrefix,
      projectId: record.projectId,
      scopes: record.scopes,
      plaintextKey,
      createdAt: record.createdAt,
    };
  }

  async list(organizationId: string, projectId?: string) {
    return this.prisma.apiKey.findMany({
      where: {
        organizationId,
        projectId: projectId ?? undefined,
        revokedAt: null,
      },
      select: {
        id: true,
        name: true,
        keyPrefix: true,
        scopes: true,
        projectId: true,
        environmentId: true,
        createdAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async revoke(organizationId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({
      where: { id: keyId, organizationId },
    });
    if (!key) {
      throw new NotFoundException('API key not found');
    }
    return this.prisma.apiKey.update({
      where: { id: keyId },
      data: { revokedAt: new Date() },
    });
  }

  async validate(rawKey: string) {
    const prefix = rawKey.slice(0, 16);
    const candidates = await this.prisma.apiKey.findMany({
      where: { keyPrefix: prefix, revokedAt: null },
    });

    for (const candidate of candidates) {
      const match = await bcrypt.compare(rawKey, candidate.keyHash);
      if (match) {
        return candidate;
      }
    }
    return null;
  }

  private generateKey(): string {
    const suffix = randomBytes(24).toString('base64url');
    return `at_live_${suffix}`;
  }
}
