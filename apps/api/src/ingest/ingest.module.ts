import { Module } from '@nestjs/common';
import { IngestController } from './ingest.controller';
import { IdempotencyService } from './idempotency.service';
import { IngestPublisher } from './ingest.publisher';
import { IngestService } from './ingest.service';
import { PayloadOffloadService } from './payload-offload.service';
import { PermissionSnapshotHandler } from './permission-snapshot.handler';
import { IngestAuthGuard } from './guards/ingest-auth.guard';

@Module({
  controllers: [IngestController],
  providers: [
    IngestService,
    PayloadOffloadService,
    IngestPublisher,
    IdempotencyService,
    PermissionSnapshotHandler,
    IngestAuthGuard,
  ],
  exports: [IngestService],
})
export class IngestModule {}
