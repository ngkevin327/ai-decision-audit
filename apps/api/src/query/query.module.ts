import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { TracesModule } from '../traces/traces.module';
import { PayloadHydrationService } from './payload-hydration.service';
import { QueryAuthGuard } from './guards/query-auth.guard';
import { ReplayController } from './replay.controller';
import { ReplayService } from './replay.service';
import { TraceDetailService } from './trace-detail.service';
import { TracesQueryController } from './traces-query.controller';
import { TracesQueryService } from './traces-query.service';

@Module({
  imports: [TracesModule, StorageModule],
  controllers: [TracesQueryController, ReplayController],
  providers: [
    TracesQueryService,
    TraceDetailService,
    PayloadHydrationService,
    ReplayService,
    QueryAuthGuard,
  ],
  exports: [TracesQueryService, TraceDetailService, ReplayService],
})
export class QueryModule {}
