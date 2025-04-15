import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/prisma/prisma.module';
import { HashChainProcessor } from './hash-chain.processor';
import { SearchProjectionService } from './search-projection.service';
import { IndexerConsumer } from './indexer.consumer';
import { IndexerService } from './indexer.service';

@Module({
  imports: [PrismaModule],
  providers: [IndexerService, IndexerConsumer, HashChainProcessor, SearchProjectionService],
})
export class IndexerModule {}
