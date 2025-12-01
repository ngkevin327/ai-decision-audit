import type {
  Actor,
  PermissionSnapshot,
  TraceEvent,
  TraceIngestEnvelope,
} from '@audit-trail/schema';

export interface TraceSink {
  enqueue(envelope: TraceIngestEnvelope): void;
  flush(): Promise<void>;
}

export interface AuditTrailClientConfig {
  /** API key with trace:ingest scope (prefix at_). */
  apiKey: string;
  /** Project the traces belong to. */
  projectId: string;
  /** Deployment environment label stored on traces. */
  environment?: 'staging' | 'production';
  /** API base URL, e.g. https://api.example.com */
  baseUrl?: string;
  /** Optional buffered transport sink (see BufferedTransport). */
  sink?: TraceSink;
}

export interface TraceOptions {
  actor: Actor;
  permission_snapshot: PermissionSnapshot;
  tags?: Record<string, string>;
  environment?: 'staging' | 'production';
}

export interface SpanOptions {
  parent_span_id?: string;
}

/**
 * Primary SDK entry point for instrumenting AI workflows.
 */
export class AuditTrailClient {
  private readonly config: Required<Pick<AuditTrailClientConfig, 'baseUrl'>> &
    AuditTrailClientConfig;
  private readonly pending: TraceIngestEnvelope[] = [];
  private readonly sink?: TraceSink;

  constructor(config: AuditTrailClientConfig) {
    if (!config.apiKey?.trim()) {
      throw new Error('AuditTrailClient requires apiKey');
    }
    if (!config.projectId?.trim()) {
      throw new Error('AuditTrailClient requires projectId');
    }
    this.config = {
      ...config,
      baseUrl: config.baseUrl ?? 'http://localhost:3000',
    };
    this.sink = config.sink;
  }

  /**
   * Start a new trace for a named workflow.
   */
  trace(workflowName: string, options: TraceOptions): ActiveTrace {
    const traceId = `tr_${randomId()}`;
    const envelope: TraceIngestEnvelope = {
      schema_version: '1.0',
      trace_id: traceId,
      workflow_name: workflowName,
      environment: options.environment ?? this.config.environment,
      actor: options.actor,
      permission_snapshot: options.permission_snapshot,
      started_at: new Date().toISOString(),
      status: 'in_progress',
      tags: options.tags,
      spans: [],
    };
    this.syncEnvelope(envelope);
    return new ActiveTrace(envelope, () => this.syncEnvelope(envelope));
  }

  /**
   * Flush buffered traces to the ingest API.
   * Transport batching is wired in a later module.
   */
  async flush(): Promise<void> {
    if (this.sink) {
      await this.sink.flush();
      return;
    }
    if (this.pending.length === 0) {
      return;
    }
    const batch = this.pending.splice(0, this.pending.length);
    for (const envelope of batch) {
      await this.postEnvelope(envelope);
    }
  }

  private syncEnvelope(envelope: TraceIngestEnvelope): void {
    if (this.sink) {
      this.sink.enqueue(envelope);
      return;
    }
    const existing = this.pending.findIndex((t) => t.trace_id === envelope.trace_id);
    if (existing >= 0) {
      this.pending[existing] = envelope;
    } else {
      this.pending.push(envelope);
    }
  }

  /** @internal */
  async postEnvelope(envelope: TraceIngestEnvelope): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/v1/traces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': this.config.apiKey,
        'X-Project-Id': this.config.projectId,
        'Idempotency-Key': envelope.trace_id,
      },
      body: JSON.stringify(envelope),
    });
    if (!response.ok && response.status !== 202) {
      const body = await response.text();
      throw new Error(`Ingest failed (${response.status}): ${body}`);
    }
  }
}

export class ActiveTrace {
  constructor(
    private readonly envelope: TraceIngestEnvelope,
    private readonly onChange: () => void,
  ) {}

  get traceId(): string {
    return this.envelope.trace_id;
  }

  span(name: string, _options?: SpanOptions): ActiveSpan {
    const spanId = `span_${randomId()}`;
    const span = { span_id: spanId, name, events: [] };
    this.envelope.spans.push(span);
    this.onChange();
    return new ActiveSpan(this.envelope, span, this.onChange);
  }

  complete(): void {
    this.envelope.status = 'completed';
    this.onChange();
  }

  fail(): void {
    this.envelope.status = 'failed';
    this.onChange();
  }

  toEnvelope(): TraceIngestEnvelope {
    return this.envelope;
  }
}

export class ActiveSpan {
  constructor(
    private readonly envelope: TraceIngestEnvelope,
    private readonly span: TraceIngestEnvelope['spans'][number],
    private readonly onChange: () => void,
  ) {}

  get spanId(): string {
    return this.span.span_id;
  }

  get traceId(): string {
    return this.envelope.trace_id;
  }

  addEvent(event: TraceEvent): void {
    this.span.events.push(event);
    this.onChange();
  }
}

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
