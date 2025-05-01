import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/prisma/prisma.module';
import { HashChainProcessor } from './hash-chain.processor';
import { SearchProjectionService } from './search-projection.service';
import { IndexLagMetric } from '../metrics/index-lag.metric';
import { IndexerDlqHandler } from './indexer.dlq';
import { TraceSealService } from './trace-seal.service';
import { TraceStatusResolver } from './trace-status.resolver';
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
    IndexerDlqHandler,
    IndexLagMetric,
  ],
})
export class IndexerModule {}
