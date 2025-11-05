export interface TraceListItem {
  trace_id: string;
  workflow_name: string;
  status: string;
  started_at: string;
  received_at: string;
  completed_at: string | null;
  project_id: string;
  chain_hash: string | null;
}

export interface TraceListResponse {
  traces: TraceListItem[];
  next_cursor: string | null;
}

export interface PermissionSnapshot {
  policy_version: string;
  roles: string[];
  scopes: string[];
  resource_ids: string[];
  denied_resources: string[];
  captured_at: string;
}

export interface TraceEvent {
  event_id: string;
  span_id: string;
  span_name: string;
  type: string;
  occurred_at: string;
  sequence_index: number;
  content_hash: string;
  chain_hash: string;
  payload_ref: string | null;
  payload: unknown | null;
}

export interface TraceDetail {
  trace_id: string;
  workflow_name: string;
  status: string;
  started_at: string;
  received_at: string;
  completed_at: string | null;
  sealed_at: string | null;
  chain_hash: string | null;
  actor: unknown;
  tags: unknown;
  permission_snapshot: PermissionSnapshot | null;
  events: TraceEvent[];
}

export interface ReplayStep {
  event_id: string;
  type: string;
  occurred_at: string;
  span_id: string;
  span_name: string;
  payload: unknown | null;
  prev_event_id: string | null;
  next_event_id: string | null;
}

export interface ReplayTimeline {
  trace_id: string;
  workflow_name: string;
  permission_snapshot: PermissionSnapshot | null;
  steps: ReplayStep[];
}

export interface TraceSearchParams {
  project_id?: string;
  status?: string;
  workflow_name?: string;
  actor_id?: string;
  model?: string;
  q?: string;
  started_after?: string;
  started_before?: string;
  cursor?: string;
  limit?: number;
}

type RequestFn = <T>(path: string, init?: RequestInit) => Promise<T>;

function toQuery(params: TraceSearchParams): string {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') {
      search.set(key, String(value));
    }
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export function fetchTraces(request: RequestFn, params: TraceSearchParams = {}) {
  return request<TraceListResponse>(`/v1/traces${toQuery(params)}`);
}

export function fetchTraceDetail(request: RequestFn, traceId: string) {
  return request<TraceDetail>(`/v1/traces/${encodeURIComponent(traceId)}`);
}

export function fetchReplay(request: RequestFn, traceId: string) {
  return request<ReplayTimeline>(`/v1/traces/${encodeURIComponent(traceId)}/replay`);
}
