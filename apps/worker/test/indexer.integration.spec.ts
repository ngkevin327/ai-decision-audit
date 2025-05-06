import { Test } from '@nestjs/testing';
import { EventType, TraceStatus } from '@prisma/client';
import { IndexerService } from '../src/indexer/indexer.service';
import { HashChainProcessor } from '../src/indexer/hash-chain.processor';
import { SearchProjectionService } from '../src/indexer/search-projection.service';
import { TraceSealService } from '../src/indexer/trace-seal.service';
import { TraceStatusResolver } from '../src/indexer/trace-status.resolver';
import { IndexLagMetric } from '../src/metrics/index-lag.metric';
import { PrismaService } from '@api/prisma/prisma.service';

const GOLDEN = {
  contentHashes: [
    'a2f3b6c94d6c6e94b4950df69e3cfb4d919bc5eda6e9185eb018c8056bd775e1',
    'b551530904725b6a0a09ae0aa85774dd2ad19139f34fc8677e44faa17cd12b86',
  ],
  chainHashes: [
    '9a8fe05aceb854f4ac927fc7b6d2d100d8ed89ce8b1d10a7800806f21276e957',
    '20e16e4532c2003864d185750e258dfdfd794e60ab0dd670641083baa4f3d879',
  ],
};

function buildTrace(status: TraceStatus, includeCompletion: boolean) {
  const events = [
    {
      sequenceIndex: 0,
      contentHash: GOLDEN.contentHashes[0],
      chainHash: GOLDEN.chainHashes[0],
      type: EventType.prompt,
    },
  ];
  if (includeCompletion) {
    events.push({
      sequenceIndex: 1,
      contentHash: GOLDEN.contentHashes[1],
      chainHash: GOLDEN.chainHashes[1],
      type: EventType.completion,
    });
  }

  return {
    id: 'trace-uuid',
    organizationId: 'org-1',
    projectId: 'proj-1',
    status,
    workflowName: 'support_refund',
    serverReceivedAt: new Date('2026-05-19T14:00:00Z'),
    actor: { actor_id: 'user_42', actor_type: 'user' },
    tags: { model: 'gpt-4o' },
    spans: [{ events }],
  };
}

describe('IndexerService integration', () => {
  let indexer: IndexerService;
  let prisma: {
    trace: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      update: jest.Mock;
    };
  };
  let indexLag: IndexLagMetric;

  beforeEach(async () => {
    prisma = {
      trace: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn().mockResolvedValue({}),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        IndexerService,
        HashChainProcessor,
        SearchProjectionService,
        TraceSealService,
        TraceStatusResolver,
        IndexLagMetric,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    indexer = moduleRef.get(IndexerService);
    indexLag = moduleRef.get(IndexLagMetric);
  });

  it('indexes trace, updates projection, and records lag', async () => {
    const trace = buildTrace(TraceStatus.in_progress, true);
    prisma.trace.findFirst.mockResolvedValue(trace);
    prisma.trace.findUnique.mockResolvedValue({
      ...trace,
      indexedAt: new Date('2026-05-19T14:00:05Z'),
    });

    await indexer.processIndexJob({
      traceId: trace.id,
      organizationId: trace.organizationId,
      projectId: trace.projectId,
      enqueuedAt: new Date().toISOString(),
    });

    expect(prisma.trace.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: trace.id },
        data: expect.objectContaining({
          indexedAt: expect.any(Date),
          primaryModel: 'gpt-4o',
        }),
      }),
    );
    expect(indexLag.getLatestLagSeconds()).toBeGreaterThanOrEqual(0);
  });

  it('seals completed traces with final chain hash', async () => {
    const trace = buildTrace(TraceStatus.in_progress, true);
    prisma.trace.findFirst.mockResolvedValue(trace);
    prisma.trace.findUnique.mockResolvedValue({
      ...trace,
      indexedAt: new Date('2026-05-19T14:00:05Z'),
    });

    await indexer.processIndexJob({
      traceId: trace.id,
      organizationId: trace.organizationId,
      projectId: trace.projectId,
      enqueuedAt: new Date().toISOString(),
    });

    expect(prisma.trace.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: TraceStatus.completed,
          chainHash: GOLDEN.chainHashes[1],
          sealedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('leaves in_progress traces unsealed when no terminal event', async () => {
    const trace = buildTrace(TraceStatus.in_progress, false);
    prisma.trace.findFirst.mockResolvedValue(trace);
    prisma.trace.findUnique.mockResolvedValue({
      ...trace,
      indexedAt: new Date('2026-05-19T14:00:02Z'),
    });

    await indexer.processIndexJob({
      traceId: trace.id,
      organizationId: trace.organizationId,
      projectId: trace.projectId,
      enqueuedAt: new Date().toISOString(),
    });

    const sealCalls = prisma.trace.update.mock.calls.filter((call) =>
      Object.prototype.hasOwnProperty.call(call[0].data, 'sealedAt'),
    );
    expect(sealCalls).toHaveLength(0);
  });
});
