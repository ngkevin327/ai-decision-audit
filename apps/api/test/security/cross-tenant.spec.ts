import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ExportJobStatus, Role, TraceStatus } from '@prisma/client';
import { TenantContextService } from '../../src/common/tenant/tenant-context.service';
import { ExportsService, EXPORT_QUEUE } from '../../src/exports/exports.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TraceDetailService } from '../../src/query/trace-detail.service';
import { TracesQueryService } from '../../src/query/traces-query.service';
import { PayloadHydrationService } from '../../src/query/payload-hydration.service';
import { ProjectsService } from '../../src/projects/projects.service';
import { QUEUE_SERVICE } from '../../src/queue/queue.interface';

/**
 * Cross-tenant penetration-style tests — every read path must scope by organizationId.
 * Returns 404 (not 403) for foreign resources to avoid enumeration (PRD launch checklist).
 */
describe('Cross-tenant isolation (security)', () => {
  describe('TraceDetailService', () => {
    let detail: TraceDetailService;
    let tenantContext: TenantContextService;
    let prisma: {
      trace: { findFirst: jest.Mock };
      organization: { findUnique: jest.Mock };
    };

    beforeEach(async () => {
      prisma = {
        trace: { findFirst: jest.fn() },
        organization: { findUnique: jest.fn().mockResolvedValue({ planTier: 'growth' }) },
      };

      const moduleRef = await Test.createTestingModule({
        providers: [
          TraceDetailService,
          TenantContextService,
          {
            provide: PayloadHydrationService,
            useValue: { createRequestCache: () => new Map(), hydrateMany: jest.fn() },
          },
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      detail = moduleRef.get(TraceDetailService);
      tenantContext = moduleRef.get(TenantContextService);
    });

    it('does not return trace detail when trace belongs to another organization', async () => {
      prisma.trace.findFirst.mockResolvedValue(null);

      await expect(
        tenantContext.run(
          {
            authMethod: 'api_key',
            organizationId: 'org-attacker',
            projectId: 'proj-attacker',
            scopes: ['trace:read'],
            apiKeyId: 'key-a',
          },
          () => detail.getDetail('tr_victim_trace'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.trace.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            organizationId: 'org-attacker',
            projectId: 'proj-attacker',
          }),
        }),
      );
    });

    it('never queries without organizationId in where clause', async () => {
      prisma.trace.findFirst.mockResolvedValue({
        id: 'uuid-1',
        externalTraceId: 'tr_1',
        workflowName: 'wf',
        status: TraceStatus.completed,
        startedAt: new Date(),
        serverReceivedAt: new Date(),
        completedAt: null,
        sealedAt: null,
        chainHash: null,
        actor: {},
        tags: null,
        spans: [],
        permissionSnapshot: null,
      });

      await tenantContext.run(
        {
          authMethod: 'api_key',
          organizationId: 'org-a',
          projectId: 'proj-a',
          scopes: ['trace:read'],
          apiKeyId: 'key-1',
        },
        () => detail.getDetail('tr_1'),
      );

      const where = prisma.trace.findFirst.mock.calls[0][0].where;
      expect(where.organizationId).toBe('org-a');
      expect(where.projectId).toBe('proj-a');
    });
  });

  describe('TracesQueryService', () => {
    let query: TracesQueryService;
    let tenantContext: TenantContextService;
    let prisma: { trace: { findMany: jest.Mock }; organization: { findUnique: jest.Mock } };

    beforeEach(async () => {
      prisma = {
        trace: { findMany: jest.fn().mockResolvedValue([]) },
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

    it('search never includes another organization traces', async () => {
      await tenantContext.run(
        {
          authMethod: 'jwt',
          organizationId: 'org-b',
          userId: 'user-1',
          role: Role.viewer,
          scopes: ['trace:read'],
        },
        () => query.search({ limit: 25 }),
      );

      expect(prisma.trace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ organizationId: 'org-b' }),
        }),
      );
    });

    it('cannot filter into a foreign project without tenant context project', async () => {
      await tenantContext.run(
        {
          authMethod: 'api_key',
          organizationId: 'org-a',
          projectId: 'proj-owned',
          scopes: ['trace:read'],
          apiKeyId: 'key-1',
        },
        () => query.search({ limit: 10, projectId: 'proj-other-org' }),
      );

      const where = prisma.trace.findMany.mock.calls[0][0].where;
      expect(where.organizationId).toBe('org-a');
    });
  });

  describe('ExportsService', () => {
    let exportsService: ExportsService;
    let tenantContext: TenantContextService;
    let prisma: {
      exportJob: {
        findFirst: jest.Mock;
        findMany: jest.Mock;
        create: jest.Mock;
      };
    };
    const queue = { publish: jest.fn().mockResolvedValue(undefined) };

    beforeEach(async () => {
      prisma = {
        exportJob: {
          findFirst: jest.fn(),
          findMany: jest.fn().mockResolvedValue([]),
          create: jest.fn(),
        },
      };

      const moduleRef = await Test.createTestingModule({
        providers: [
          ExportsService,
          TenantContextService,
          { provide: PrismaService, useValue: prisma },
          { provide: QUEUE_SERVICE, useValue: queue },
        ],
      }).compile();

      exportsService = moduleRef.get(ExportsService);
      tenantContext = moduleRef.get(TenantContextService);
    });

    it('returns 404 when export job belongs to another organization', async () => {
      prisma.exportJob.findFirst.mockResolvedValue(null);

      await expect(
        tenantContext.run(
          {
            authMethod: 'jwt',
            organizationId: 'org-attacker',
            userId: 'user-x',
            role: Role.org_admin,
            scopes: ['export:read'],
          },
          () => exportsService.getExport('export-victim-uuid'),
        ),
      ).rejects.toBeInstanceOf(NotFoundException);

      expect(prisma.exportJob.findFirst).toHaveBeenCalledWith({
        where: { id: 'export-victim-uuid', organizationId: 'org-attacker' },
      });
    });

    it('lists only export jobs for the authenticated organization', async () => {
      prisma.exportJob.findMany.mockResolvedValue([
        {
          id: 'exp-1',
          status: ExportJobStatus.completed,
          traceCount: 1,
          createdAt: new Date(),
          completedAt: new Date(),
          downloadExpiresAt: new Date(),
          manifestHash: 'mh',
          chainHash: 'ch',
          errorMessage: null,
        },
      ]);

      const result = await tenantContext.run(
        {
          authMethod: 'jwt',
          organizationId: 'org-a',
          userId: 'user-1',
          role: Role.developer,
          scopes: ['export:read'],
        },
        () => exportsService.listExports(),
      );

      expect(result).toHaveLength(1);
      expect(prisma.exportJob.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-a' },
        }),
      );
    });

    it('creates export jobs scoped to caller organization', async () => {
      prisma.exportJob.create.mockResolvedValue({
        id: 'exp-new',
        status: ExportJobStatus.pending,
        traceCount: 0,
        createdAt: new Date(),
        completedAt: null,
        downloadExpiresAt: null,
        manifestHash: null,
        chainHash: null,
        errorMessage: null,
      });

      await tenantContext.run(
        {
          authMethod: 'jwt',
          organizationId: 'org-creator',
          userId: 'user-1',
          role: Role.developer,
          scopes: ['export:create'],
          projectId: 'proj-1',
        },
        () => exportsService.createExport({ filters: {} }),
      );

      expect(prisma.exportJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ organizationId: 'org-creator' }),
        }),
      );
      expect(queue.publish).toHaveBeenCalledWith(
        EXPORT_QUEUE,
        expect.objectContaining({ organizationId: 'org-creator' }),
        expect.any(Object),
      );
    });
  });

  describe('ProjectsService', () => {
    let projects: ProjectsService;
    let prisma: { project: { findFirst: jest.Mock; findMany: jest.Mock } };

    beforeEach(async () => {
      prisma = {
        project: { findFirst: jest.fn(), findMany: jest.fn().mockResolvedValue([]) },
      };

      const moduleRef = await Test.createTestingModule({
        providers: [
          ProjectsService,
          TenantContextService,
          { provide: PrismaService, useValue: prisma },
        ],
      }).compile();

      projects = moduleRef.get(ProjectsService);
    });

    it('obfuscates foreign project as 404', async () => {
      prisma.project.findFirst.mockResolvedValue(null);
      await expect(projects.findById('org-a', 'proj-in-org-b')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('listByOrganization never mixes org boundaries', async () => {
      await projects.listByOrganization('org-z');
      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { organizationId: 'org-z' },
        }),
      );
    });
  });

  describe('TenantContextService concurrency', () => {
    it('prevents context bleed between parallel requests', async () => {
      const service = new TenantContextService();
      const results: string[] = [];

      await Promise.all([
        service.run(
          {
            authMethod: 'jwt',
            organizationId: 'org-1',
            userId: 'u1',
            role: Role.viewer,
            scopes: ['trace:read'],
          },
          async () => {
            await new Promise((r) => setTimeout(r, 5));
            results.push(service.get()?.organizationId ?? 'missing');
          },
        ),
        service.run(
          {
            authMethod: 'jwt',
            organizationId: 'org-2',
            userId: 'u2',
            role: Role.viewer,
            scopes: ['trace:read'],
          },
          async () => {
            await new Promise((r) => setTimeout(r, 2));
            results.push(service.get()?.organizationId ?? 'missing');
          },
        ),
      ]);

      expect(results).toContain('org-1');
      expect(results).toContain('org-2');
      expect(results.filter((id) => id === 'org-1' || id === 'org-2')).toHaveLength(2);
    });
  });
});
