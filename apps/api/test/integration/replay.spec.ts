import { Test } from '@nestjs/testing';
import { EventType, TraceStatus } from '@prisma/client';
import { TenantContextService } from '../../src/common/tenant/tenant-context.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { PayloadHydrationService } from '../../src/query/payload-hydration.service';
import { ReplayService } from '../../src/query/replay.service';
import { TraceDetailService } from '../../src/query/trace-detail.service';

describe('ReplayService integration', () => {
  let replay: ReplayService;
  let tenantContext: TenantContextService;

  beforeEach(async () => {
    const trace = {
      id: 'uuid-1',
      externalTraceId: 'tr_replay_1',
      workflowName: 'wf',
      status: TraceStatus.completed,
      startedAt: new Date('2026-05-19T14:00:00Z'),
      serverReceivedAt: new Date('2026-05-19T14:00:01Z'),
      completedAt: new Date('2026-05-19T14:05:00Z'),
      sealedAt: new Date('2026-05-19T14:05:00Z'),
      chainHash: 'final',
      actor: { actor_id: 'u1', actor_type: 'user' },
      tags: null,
      permissionSnapshot: {
        policyVersion: '2026.05.1',
        roles: ['developer'],
        scopes: ['trace:read'],
        resourceIds: [],
        deniedResources: [],
        capturedAt: new Date('2026-05-19T14:00:00Z'),
      },
      spans: [
        {
          externalSpanId: 'span_1',
          name: 'main',
          events: [
            {
              externalEventId: 'evt_a',
              type: EventType.prompt,
              occurredAt: new Date('2026-05-19T14:00:00Z'),
              sequenceIndex: 0,
              contentHash: 'c1',
              chainHash: 'h1',
              payloadRef: null,
            },
            {
              externalEventId: 'evt_b',
              type: EventType.completion,
              occurredAt: new Date('2026-05-19T14:00:01Z'),
              sequenceIndex: 1,
              contentHash: 'c2',
              chainHash: 'h2',
              payloadRef: null,
            },
          ],
        },
      ],
    };

    const prisma = {
      trace: { findFirst: jest.fn().mockResolvedValue(trace) },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ReplayService,
        TraceDetailService,
        TenantContextService,
        {
          provide: PayloadHydrationService,
          useValue: {
            createRequestCache: () => new Map(),
            hydrateMany: jest.fn().mockResolvedValue([null, null]),
          },
        },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    replay = moduleRef.get(ReplayService);
    tenantContext = moduleRef.get(TenantContextService);
  });

  it('returns ordered replay steps with prev/next pointers', async () => {
    const timeline = await tenantContext.run(
      {
        authMethod: 'jwt',
        organizationId: 'org-1',
        userId: 'user-1',
        role: 'auditor',
        scopes: ['trace:read'],
      },
      () => replay.getTimeline('tr_replay_1'),
    );
    expect(timeline.steps).toHaveLength(2);
    expect(timeline.steps[0].prev_event_id).toBeNull();
    expect(timeline.steps[0].next_event_id).toBe('evt_b');
    expect(timeline.steps[1].prev_event_id).toBe('evt_a');
    expect(timeline.steps[1].next_event_id).toBeNull();
    expect(timeline.permission_snapshot?.policy_version).toBe('2026.05.1');
  });
});
