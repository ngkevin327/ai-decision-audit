export const SCHEMA_VERSION = '1.0';

export type EventType = 'prompt' | 'completion' | 'tool_call' | 'retrieval' | 'approval' | 'custom';

export type TraceStatus = 'in_progress' | 'completed' | 'failed' | 'cancelled';

export interface Actor {
  actor_id: string;
  actor_type: 'user' | 'service' | 'agent' | 'system';
  display_name?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}

export interface PermissionSnapshot {
  policy_version: string;
  roles: string[];
  scopes: string[];
  resource_ids?: string[];
  denied_resources?: string[];
  captured_at?: string;
}

export interface TraceEvent {
  schema_version: typeof SCHEMA_VERSION;
  event_id: string;
  type: EventType;
  occurred_at: string;
  span_id: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface TraceSpan {
  span_id: string;
  parent_span_id?: string;
  name: string;
  events: TraceEvent[];
}

export interface TraceIngestEnvelope {
  schema_version: typeof SCHEMA_VERSION;
  trace_id: string;
  workflow_name: string;
  environment?: 'staging' | 'production';
  actor: Actor;
  permission_snapshot: PermissionSnapshot;
  started_at: string;
  status?: TraceStatus;
  tags?: Record<string, string>;
  spans: TraceSpan[];
}
