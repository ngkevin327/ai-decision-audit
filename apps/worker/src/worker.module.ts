import { Module } from '@nestjs/common';
import { AppConfigModule } from '@api/config/config.module';
import { PrismaModule } from '@api/prisma/prisma.module';
import { QueueModule } from '@api/queue/queue.module';
import { IndexerModule } from './indexer/indexer.module';
import { ExportsWorkerModule } from './exports/export.consumer';
import { RetentionWorkerModule } from './retention/compaction.job';
import { WorkerBootstrapService } from './worker-bootstrap.service';

@Module({
  imports: [
    AppConfigModule,
    PrismaModule,
    QueueModule,
    IndexerModule,
    ExportsWorkerModule,
    RetentionWorkerModule,
  ],
  providers: [WorkerBootstrapService],
})
export class WorkerModule {}
