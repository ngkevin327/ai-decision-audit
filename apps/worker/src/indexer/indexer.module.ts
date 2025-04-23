import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/prisma/prisma.module';
import { HashChainProcessor } from './hash-chain.processor';
import { SearchProjectionService } from './search-projection.service';
import { IndexerDlqHandler } from './indexer.dlq';
import { TraceSealService } from './trace-seal.service';
import { IndexerConsumer } from './indexer.consumer';
import { IndexerService } from './indexer.service';

@Module({
  imports: [PrismaModule],
  providers: [
    IndexerService,
    IndexerConsumer,
    HashChainProcessor,
    SearchProjectionService,
    TraceSealService,
  ],
})
export class IndexerModule {}
