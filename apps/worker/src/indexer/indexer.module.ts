import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/prisma/prisma.module';
import { IndexerConsumer } from './indexer.consumer';
import { IndexerService } from './indexer.service';

@Module({
  imports: [PrismaModule],
  providers: [IndexerService, IndexerConsumer],
})
export class IndexerModule {}
