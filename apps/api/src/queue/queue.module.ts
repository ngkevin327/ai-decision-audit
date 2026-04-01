import { Module } from '@nestjs/common';
import { AppConfigModule } from '../config/config.module';
import { BullmqQueueService } from './bullmq.queue';
import { QUEUE_SERVICE } from './queue.interface';

@Module({
  imports: [AppConfigModule],
  providers: [
    BullmqQueueService,
    {
      provide: QUEUE_SERVICE,
      useExisting: BullmqQueueService,
    },
  ],
  exports: [QUEUE_SERVICE, BullmqQueueService],
})
export class QueueModule {}
