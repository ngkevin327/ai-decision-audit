import { Injectable } from '@nestjs/common';

export interface IndexLagSample {
  traceId: string;
  lagSeconds: number;
}

@Injectable()
export class IndexLagMetric {
  private latestLagSeconds = 0;
  private samples: IndexLagSample[] = [];

  record(traceId: string, serverReceivedAt: Date, indexedAt: Date): void {
    const lagSeconds = Math.max(0, (indexedAt.getTime() - serverReceivedAt.getTime()) / 1000);
    this.latestLagSeconds = lagSeconds;
    this.samples.push({ traceId, lagSeconds });
    if (this.samples.length > 100) {
      this.samples.shift();
    }
  }

  getLatestLagSeconds(): number {
    return this.latestLagSeconds;
  }

  getSnapshot(): { index_lag_seconds: number; samples: IndexLagSample[] } {
    return {
      index_lag_seconds: this.latestLagSeconds,
      samples: [...this.samples],
    };
  }
}
