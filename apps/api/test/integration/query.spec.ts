import { ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TraceStatus } from '@prisma/client';
import { TenantContextService } from '../../src/common/tenant/tenant-context.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TracesQueryService } from '../../src/query/traces-query.service';
import { QueryAuthGuard } from '../../src/query/guards/query-auth.guard';

describe('TracesQueryService integration', () => {
  let query: TracesQueryService;
  let tenantContext: TenantContextService;
  let prisma: { trace: { findMany: jest.Mock }; organization: { findUnique: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      trace: { findMany: jest.fn() },
      organization: { findUnique: jest.fn().mockResolvedValue({ planTier: 'starter' }) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TracesQueryService,
        TenantContextService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    query = moduleRef.get(TracesQueryService);
    tenantContext = moduleRef.get(TenantContextService);
  });

  it('returns traces with cursor pagination', async () => {
    prisma.trace.findMany.mockResolvedValue([
      {
        id: 'uuid-1',
        externalTraceId: 'tr_1',
        workflowName: 'wf',
        status: TraceStatus.completed,
        startedAt: new Date('2026-05-19T14:00:00Z'),
        serverReceivedAt: new Date('2026-05-19T14:00:01Z'),
        completedAt: new Date('2026-05-19T14:05:00Z'),
        projectId: 'proj-1',
        chainHash: 'abc',
      },
    ]);

    const result = await tenantContext.run(
      {
        authMethod: 'api_key',
        organizationId: 'org-1',
        projectId: 'proj-1',
        scopes: ['trace:read'],
        apiKeyId: 'key-1',
      },
      () => query.search({ limit: 10 }),
    );
    expect(result.traces).toHaveLength(1);
    expect(result.traces[0].trace_id).toBe('tr_1');
    expect(prisma.trace.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1' }),
      }),
    );
  });
});

describe('QueryAuthGuard', () => {
  it('rejects api keys without trace:read', () => {
    const tenantContext = {
      require: () => ({
        authMethod: 'api_key' as const,
        organizationId: 'org-1',
        scopes: ['trace:ingest'],
        projectId: 'proj-1',
      }),
    };
    const guard = new QueryAuthGuard(tenantContext as TenantContextService);
    expect(() => guard.canActivate({} as never)).toThrow(ForbiddenException);
  });
});
