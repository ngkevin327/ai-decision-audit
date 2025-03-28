import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IdempotencyService } from './idempotency.service';
import { IngestPublisher } from './ingest.publisher';
import { IngestService } from './ingest.service';
import { PayloadOffloadService } from './payload-offload.service';
import { PermissionSnapshotHandler } from './permission-snapshot.handler';
import { IngestAuthGuard } from './guards/ingest-auth.guard';
import { SpanTreeValidator } from './span-tree.validator';
import { TracesModule } from '../traces/traces.module';

@Module({
  imports: [TracesModule],
  controllers: [IngestController],
  providers: [
    IngestService,
    PayloadOffloadService,
    IngestPublisher,
    IdempotencyService,
    PermissionSnapshotHandler,
    IngestAuthGuard,
    SpanTreeValidator,
  ],
  exports: [IngestService],
})
export class IngestModule {}
