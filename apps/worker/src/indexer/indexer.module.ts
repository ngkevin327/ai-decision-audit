import { Module } from '@nestjs/common';
import { PrismaModule } from '@api/prisma/prisma.module';
import { HashChainProcessor } from './hash-chain.processor';
import { IndexerConsumer } from './indexer.consumer';
import { IndexerService } from './indexer.service';

@Module({
  imports: [PrismaModule],
  providers: [IndexerService, IndexerConsumer, HashChainProcessor],
})
export class IndexerModule {}
