import { Module } from '@nestjs/common';
import { AppConfigModule } from '@api/config/config.module';
import { PrismaModule } from '@api/prisma/prisma.module';
import { QueueModule } from '@api/queue/queue.module';
import { IndexerModule } from './indexer/indexer.module';
import { WorkerBootstrapService } from './worker-bootstrap.service';

@Module({
  imports: [AppConfigModule, PrismaModule, QueueModule, IndexerModule],
  providers: [WorkerBootstrapService],
})
export class WorkerModule {}
