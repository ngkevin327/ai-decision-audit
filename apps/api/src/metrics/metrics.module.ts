import { Global, Module } from '@nestjs/common';
import { IngestMetrics } from './ingest.metrics';
import { MetricsController } from './metrics.controller';

@Global()
@Module({
  controllers: [MetricsController],
  providers: [IngestMetrics],
  exports: [IngestMetrics],
})
export class MetricsModule {}
