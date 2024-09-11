import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface MetaAuditEntry {
  organizationId: string;
  actorUserId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  metadata?: Prisma.InputJsonValue;
}

@Injectable()
export class MetaAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(entry: MetaAuditEntry) {
    return this.prisma.metaAuditLog.create({ data: entry });
  }

  async list(organizationId: string, limit = 50) {
    return this.prisma.metaAuditLog.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}
