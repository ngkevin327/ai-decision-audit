import { Inject, Injectable, Logger, Module, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Worker, type Job } from 'bullmq';
import IORedis from 'ioredis';
import { AppConfigService } from '@api/config/config.service';
import { AppConfigModule } from '@api/config/config.module';
import type { ExportJobPayload } from '@api/exports/exports.service';
import { EXPORT_QUEUE } from '@api/exports/exports.service';
import { PrismaModule } from '@api/prisma/prisma.module';
import { PrismaService } from '@api/prisma/prisma.service';
import { STORAGE_SERVICE, type StorageService } from '@api/storage/storage.interface';
import { StorageModule } from '@api/storage/storage.module';
import { INDEXER_RETRY_POLICY } from '../queue/retry.policy';
import { PackageAssembler } from './package-assembler';
import type { ManifestTraceEntry } from './manifest.builder';

const DOWNLOAD_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class ExportConsumer implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExportConsumer.name);
  private worker?: Worker<ExportJobPayload>;
  private connection?: IORedis;

  constructor(
    private readonly config: AppConfigService,
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly packageAssembler: PackageAssembler,
  ) {}

  async onModuleInit() {
    this.connection = new IORedis(this.config.redisUrl, { maxRetriesPerRequest: null });
    this.worker = new Worker<ExportJobPayload>(EXPORT_QUEUE, async (job) => this.handleJob(job), {
      connection: this.connection,
      ...INDEXER_RETRY_POLICY,
    });
    this.worker.on('failed', (job, err) => {
      this.logger.error('export job failed', { jobId: job?.id, error: err.message });
    });
    this.logger.log('export consumer started', { queue: EXPORT_QUEUE });
  }

  async onModuleDestroy() {
    await this.worker?.close();
    await this.connection?.quit();
  }

  private async handleJob(job: Job<ExportJobPayload>) {
    const { exportJobId, organizationId, filters } = job.data;
    await this.prisma.exportJob.update({
      where: { id: exportJobId },
      data: { status: 'processing' },
    });

    try {
      const traces = await this.loadTraces(organizationId, filters);
      const manifestEntries: ManifestTraceEntry[] = [];
      const jsonlLines: string[] = [];

      for (const trace of traces) {
        const events = trace.spans.flatMap((span) =>
          span.events.map((event) => ({
            trace_id: trace.externalTraceId,
            span_id: span.externalSpanId,
            event_id: event.externalEventId,
            type: event.type,
            occurred_at: event.occurredAt.toISOString(),
            sequence_index: event.sequenceIndex,
            content_hash: event.contentHash,
            chain_hash: event.chainHash,
            payload_ref: event.payloadRef,
          })),
        );
        events.sort((a, b) => a.sequence_index - b.sequence_index);
        jsonlLines.push(...events.map((e) => JSON.stringify(e)));

        manifestEntries.push({
          trace_id: trace.externalTraceId,
          workflow_name: trace.workflowName,
          chain_hash: trace.chainHash,
          event_count: events.length,
        });
      }

      const manifestBuilder = this.loadManifestBuilder();
      const manifest = manifestBuilder.build({
        exportId: exportJobId,
        organizationId,
        traces: manifestEntries,
      });

      const permissionSnapshots = traces
        .filter((t) => t.permissionSnapshot)
        .map((t) => ({
          trace_id: t.externalTraceId,
          snapshot: t.permissionSnapshot,
        }));

      const files = [
        {
          path: 'manifest.json',
          body: Buffer.from(JSON.stringify(manifest, null, 2), 'utf8'),
        },
        {
          path: 'events.jsonl',
          body: Buffer.from(jsonlLines.join('\n'), 'utf8'),
        },
        {
          path: 'permission_snapshots.json',
          body: Buffer.from(JSON.stringify(permissionSnapshots, null, 2), 'utf8'),
        },
      ];

      const assembled = this.packageAssembler.assemble(files);
      const artifactKey = `exports/${organizationId}/${exportJobId}.zip`;
      await this.storage.put({
        key: artifactKey,
        body: assembled.zipBuffer,
        contentType: 'application/zip',
      });

      const downloadExpiresAt = new Date(Date.now() + DOWNLOAD_TTL_SECONDS * 1000);
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: {
          status: 'completed',
          artifactKey,
          manifestHash: manifestBuilder.manifestHash(manifest),
          chainHash: manifest.chain_hash,
          traceCount: traces.length,
          downloadExpiresAt,
          completedAt: new Date(),
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Export failed';
      await this.prisma.exportJob.update({
        where: { id: exportJobId },
        data: { status: 'failed', errorMessage: message },
      });
      throw error;
    }
  }

  private loadManifestBuilder() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { ManifestBuilder } =
        require('./manifest.builder') as typeof import('./manifest.builder');
      return new ManifestBuilder(process.env.EXPORT_SIGNING_SECRET ?? 'dev-export-signing-secret');
    } catch {
      return {
        build: (input: {
          exportId: string;
          organizationId: string;
          traces: ManifestTraceEntry[];
        }) => ({
          schema_version: '1.0',
          export_id: input.exportId,
          organization_id: input.organizationId,
          generated_at: new Date().toISOString(),
          chain_hash: input.traces.map((t) => t.chain_hash ?? '').join('') || '0'.repeat(64),
          trace_count: input.traces.length,
          traces: input.traces,
          verification: {
            algorithm: 'hmac-sha256',
            instructions: 'See docs/export-format.md',
            manifest_signature: 'pending',
          },
        }),
        manifestHash: (manifest: { chain_hash: string }) =>
          require('crypto').createHash('sha256').update(JSON.stringify(manifest)).digest('hex'),
      };
    }
  }

  private async loadTraces(organizationId: string, filters: ExportJobPayload['filters']) {
    if (filters.trace_ids?.length) {
      return this.prisma.trace.findMany({
        where: {
          organizationId,
          externalTraceId: { in: filters.trace_ids },
        },
        include: {
          permissionSnapshot: true,
          spans: { include: { events: { orderBy: { sequenceIndex: 'asc' } } } },
        },
      });
    }

    return this.prisma.trace.findMany({
      where: {
        organizationId,
        projectId: filters.project_id,
        workflowName: filters.workflow_name,
        startedAt: {
          gte: filters.started_after ? new Date(filters.started_after) : undefined,
          lte: filters.started_before ? new Date(filters.started_before) : undefined,
        },
      },
      include: {
        permissionSnapshot: true,
        spans: { include: { events: { orderBy: { sequenceIndex: 'asc' } } } },
      },
      take: 500,
    });
  }
}

@Module({
  imports: [AppConfigModule, PrismaModule, StorageModule],
  providers: [ExportConsumer, PackageAssembler],
})
export class ExportsWorkerModule {}
