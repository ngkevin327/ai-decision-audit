import { Injectable } from '@nestjs/common';
import type { TraceSpan } from '@audit-trail/schema';

export interface SpanTreeValidationResult {
  orphanSpanIds: string[];
}

@Injectable()
export class SpanTreeValidator {
  validate(spans: TraceSpan[]): SpanTreeValidationResult {
    const known = new Set(spans.map((span) => span.span_id));
    const orphanSpanIds: string[] = [];

    for (const span of spans) {
      if (span.parent_span_id && !known.has(span.parent_span_id)) {
        orphanSpanIds.push(span.span_id);
      }
    }

    return { orphanSpanIds };
  }
}
