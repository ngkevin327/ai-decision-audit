import { Controller, Get } from '@nestjs/common';
import { IngestMetrics } from './ingest.metrics';

@Controller('metrics')
export class MetricsController {
  constructor(private readonly ingestMetrics: IngestMetrics) {}

  @Get()
  getMetrics() {
    const counters = this.ingestMetrics.snapshot();
    const lines = Object.entries(counters).map(([key, value]) => `${key} ${value}`);
    return `${lines.join('\n')}\n`;
  }
}
