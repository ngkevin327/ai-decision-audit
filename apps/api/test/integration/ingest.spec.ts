import { Test } from '@nestjs/testing';
import { TraceStatus } from '@prisma/client';
import { IngestService } from '../../src/ingest/ingest.service';
import { SchemaValidationService } from '../../src/validation/schema-validation.service';
import { TenantContextService } from '../../src/common/tenant/tenant-context.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TracesRepository } from '../../src/traces/traces.repository';
import { IdempotencyService } from '../../src/ingest/idempotency.service';
import { PayloadOffloadService } from '../../src/ingest/payload-offload.service';
import { IngestPublisher } from '../../src/ingest/ingest.publisher';
import { PermissionSnapshotHandler } from '../../src/ingest/permission-snapshot.handler';
import { IngestMetrics } from '../../src/metrics/ingest.metrics';
import { SpanTreeValidator } from '../../src/ingest/span-tree.validator';
import { readFileSync } from 'fs';
import { join } from 'path';

const fixture = JSON.parse(readFileSync(join(__dirname, '../fixtures/ingest-trace.json'), 'utf-8'));

describe('IngestService integration', () => {
  let ingest: IngestService;
  let tenantContext: TenantContextService;
  const publishIndexJob = jest.fn().mockResolvedValue('job-1');
  const createFromIngest = jest.fn().mockResolvedValue({
    id: 'trace-uuid',
    externalTraceId: 'tr_ingest_test_001',
    serverReceivedAt: new Date('2026-05-19T14:32:00Z'),
  });

  beforeEach(async () => {
    publishIndexJob.mockClear();
    createFromIngest.mockClear();

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestService,
        SchemaValidationService,
        TenantContextService,
        PermissionSnapshotHandler,
        SpanTreeValidator,
        IngestMetrics,
        {
          provide: PrismaService,
          useValue: {
            trace: { findUnique: jest.fn() },
          },
        },
        {
          provide: TracesRepository,
          useValue: { createFromIngest },
        },
        {
          provide: IdempotencyService,
          useValue: { findCached: jest.fn(), store: jest.fn() },
        },
        {
          provide: PayloadOffloadService,
          useValue: {
            maybeOffload: jest.fn().mockResolvedValue({ payloadRef: null, inline: true }),
          },
        },
        {
          provide: IngestPublisher,
          useValue: { publishIndexJob },
        },
      ],
    }).compile();

    ingest = moduleRef.get(IngestService);
    tenantContext = moduleRef.get(TenantContextService);
  });

  it('accepts a valid trace and enqueues indexing', async () => {
    const response = await tenantContext.run(
      {
        authMethod: 'api_key',
        organizationId: 'org-1',
        projectId: 'proj-1',
        scopes: ['trace:ingest'],
        apiKeyId: 'key-1',
      },
      () => ingest.acceptTrace(fixture),
    );

    expect(response.trace_id).toBe('tr_ingest_test_001');
    expect(createFromIngest).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        projectId: 'proj-1',
        status: TraceStatus.in_progress,
      }),
    );
    expect(publishIndexJob).toHaveBeenCalled();
  });
});
