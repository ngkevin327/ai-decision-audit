import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@api/prisma/prisma.service';
import type { TraceIndexJob } from '@api/ingest/ingest.publisher';
import { HashChainProcessor } from './hash-chain.processor';

@Injectable()
export class IndexerService {
  private readonly logger = new Logger(IndexerService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly hashChainProcessor: HashChainProcessor,
  ) {}

  async processIndexJob(job: TraceIndexJob): Promise<void> {
    const trace = await this.prisma.trace.findFirst({
      where: { id: job.traceId, organizationId: job.organizationId },
      include: {
        spans: {
          include: {
            events: { orderBy: { sequenceIndex: 'asc' } },
          },
        },
      },
    });

    if (!trace) {
      throw new NotFoundException(`Trace ${job.traceId} not found for indexing`);
    }

    const orderedEvents = trace.spans
      .flatMap((span) => span.events)
      .sort((a, b) => a.sequenceIndex - b.sequenceIndex)
      .map((event) => ({
        contentHash: event.contentHash,
        chainHash: event.chainHash,
      }));

    const finalChainHash = this.hashChainProcessor.verifyChain(orderedEvents);

    this.logger.log('hash chain verified', {
      traceId: job.traceId,
      finalChainHash,
      eventCount: orderedEvents.length,
    });
  }
}
