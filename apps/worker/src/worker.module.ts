import { Module } from '@nestjs/common';
import { AppConfigModule } from '@api/config/config.module';
import { PrismaModule } from '@api/prisma/prisma.module';
import { QueueModule } from '@api/queue/queue.module';
import { WorkerBootstrapService } from './worker-bootstrap.service';

@Module({
  imports: [AppConfigModule, PrismaModule, QueueModule],
  providers: [WorkerBootstrapService],
})
export class WorkerModule {}
