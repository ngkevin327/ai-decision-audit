import type {
  Actor,
  PermissionSnapshot,
  TraceEvent,
  TraceIngestEnvelope,
  TraceSpan,
} from '@audit-trail/schema';
import { SCHEMA_VERSION } from '@audit-trail/schema';

export interface TraceBuilderOptions {
  workflow_name: string;
  actor: Actor;
  permission_snapshot: PermissionSnapshot;
  environment?: 'staging' | 'production';
  tags?: Record<string, string>;
  trace_id?: string;
  started_at?: string;
}

/**
 * Fluent builder for a trace ingest envelope.
 */
export class TraceBuilder {
  private readonly envelope: TraceIngestEnvelope;

  constructor(options: TraceBuilderOptions) {
    this.envelope = {
      schema_version: SCHEMA_VERSION,
      trace_id: options.trace_id ?? `tr_${randomId()}`,
      workflow_name: options.workflow_name,
      environment: options.environment,
      actor: options.actor,
      permission_snapshot: options.permission_snapshot,
      started_at: options.started_at ?? new Date().toISOString(),
      status: 'in_progress',
      tags: options.tags,
      spans: [],
    };
  }

  get traceId(): string {
    return this.envelope.trace_id;
  }

  span(name: string, parentSpanId?: string): SpanBuilder {
    const span: TraceSpan = {
      span_id: `span_${randomId()}`,
      parent_span_id: parentSpanId,
      name,
      events: [],
    };
    this.envelope.spans.push(span);
    return new SpanBuilder(this.envelope, span);
  }

  markCompleted(): this {
    this.envelope.status = 'completed';
    return this;
  }

  markFailed(): this {
    this.envelope.status = 'failed';
    return this;
  }

  markCancelled(): this {
    this.envelope.status = 'cancelled';
    return this;
  }

  build(): TraceIngestEnvelope {
    return structuredClone(this.envelope);
  }
}

export class SpanBuilder {
  constructor(
    private readonly envelope: TraceIngestEnvelope,
    private readonly span: TraceSpan,
  ) {}

  get spanId(): string {
    return this.span.span_id;
  }

  get traceId(): string {
    return this.envelope.trace_id;
  }

  addEvent(event: TraceEvent): this {
    this.span.events.push(event);
    return this;
  }

  childSpan(name: string): SpanBuilder {
    const child: TraceSpan = {
      span_id: `span_${randomId()}`,
      parent_span_id: this.span.span_id,
      name,
      events: [],
    };
    this.envelope.spans.push(child);
    return new SpanBuilder(this.envelope, child);
  }
}

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
