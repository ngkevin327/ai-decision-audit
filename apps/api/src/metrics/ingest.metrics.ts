import { Injectable } from '@nestjs/common';

@Injectable()
export class IngestMetrics {
  private accepted = 0;
  private rejected = 0;

  recordAccepted(count = 1) {
    this.accepted += count;
  }

  recordRejected(count = 1) {
    this.rejected += count;
  }

  snapshot() {
    return {
      ingest_accepted_total: this.accepted,
      ingest_rejected_total: this.rejected,
    };
  }
}
