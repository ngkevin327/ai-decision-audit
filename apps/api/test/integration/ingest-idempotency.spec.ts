import { Test } from '@nestjs/testing';
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

const fixture = {
  schema_version: '1.0',
  trace_id: 'tr_idempotent_001',
  workflow_name: 'wf',
  actor: { actor_id: 'u1', actor_type: 'user' },
  permission_snapshot: { policy_version: '1', roles: ['dev'], scopes: [] },
  started_at: '2026-05-19T14:00:00Z',
  spans: [
    {
      span_id: 's1',
      name: 'main',
      events: [
        {
          schema_version: '1.0',
          event_id: 'evt_dup_001',
          type: 'custom',
          occurred_at: '2026-05-19T14:00:01Z',
          span_id: 's1',
          payload: { name: 'x', data: {} },
        },
      ],
    },
  ],
};

describe('Ingest idempotency', () => {
  it('returns cached response when idempotency key is replayed', async () => {
    const findCached = jest.fn().mockResolvedValue({
      trace_id: 'tr_cached',
      received_at: '2026-05-19T14:00:00.000Z',
    });

    const moduleRef = await Test.createTestingModule({
      providers: [
        IngestService,
        SchemaValidationService,
        TenantContextService,
        PermissionSnapshotHandler,
        SpanTreeValidator,
        IngestMetrics,
        { provide: PrismaService, useValue: { trace: { findUnique: jest.fn() } } },
        { provide: TracesRepository, useValue: { createFromIngest: jest.fn() } },
        { provide: IdempotencyService, useValue: { findCached, store: jest.fn() } },
        {
          provide: PayloadOffloadService,
          useValue: { maybeOffload: jest.fn() },
        },
        { provide: IngestPublisher, useValue: { publishIndexJob: jest.fn() } },
      ],
    }).compile();

    const ingest = moduleRef.get(IngestService);
    const tenantContext = moduleRef.get(TenantContextService);

    const response = await tenantContext.run(
      {
        authMethod: 'api_key',
        organizationId: 'org-1',
        projectId: 'proj-1',
        scopes: ['trace:ingest'],
      },
      () => ingest.acceptTrace(fixture, 'idem-key-1'),
    );

    expect(response.trace_id).toBe('tr_cached');
    expect(findCached).toHaveBeenCalledWith('org-1', 'idem-key-1');
  });
});
