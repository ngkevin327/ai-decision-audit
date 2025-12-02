import { SCHEMA_VERSION, type EventType, type TraceEvent } from '@audit-trail/schema';

export interface EventInput {
  type: EventType;
  span_id: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  occurred_at?: string;
}

/**
 * Build a schema-valid trace event with a generated event id.
 */
export function buildEvent(input: EventInput): TraceEvent {
  return {
    schema_version: SCHEMA_VERSION,
    event_id: `evt_${randomId()}`,
    type: input.type,
    occurred_at: input.occurred_at ?? new Date().toISOString(),
    span_id: input.span_id,
    payload: input.payload,
    metadata: input.metadata,
  };
}

export function promptEvent(
  spanId: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): TraceEvent {
  return buildEvent({ type: 'prompt', span_id: spanId, payload, metadata });
}

export function completionEvent(
  spanId: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): TraceEvent {
  return buildEvent({ type: 'completion', span_id: spanId, payload, metadata });
}

export function toolCallEvent(
  spanId: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): TraceEvent {
  return buildEvent({ type: 'tool_call', span_id: spanId, payload, metadata });
}

export function retrievalEvent(
  spanId: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): TraceEvent {
  return buildEvent({ type: 'retrieval', span_id: spanId, payload, metadata });
}

export function approvalEvent(
  spanId: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): TraceEvent {
  return buildEvent({ type: 'approval', span_id: spanId, payload, metadata });
}

export function customEvent(
  spanId: string,
  payload: Record<string, unknown>,
  metadata?: Record<string, unknown>,
): TraceEvent {
  return buildEvent({ type: 'custom', span_id: spanId, payload, metadata });
}

function randomId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}
