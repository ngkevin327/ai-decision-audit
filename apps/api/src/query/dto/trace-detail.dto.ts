import { EventType, TraceStatus } from '@prisma/client';

export interface TraceEventTimelineItemDto {
  event_id: string;
  span_id: string;
  span_name: string;
  type: EventType;
  occurred_at: string;
  sequence_index: number;
  content_hash: string;
  chain_hash: string;
  payload_ref: string | null;
  payload: unknown | null;
}

export interface TraceDetailDto {
  trace_id: string;
  workflow_name: string;
  status: TraceStatus;
  started_at: string;
  received_at: string;
  completed_at: string | null;
  sealed_at: string | null;
  chain_hash: string | null;
  actor: unknown;
  tags: unknown;
  events: TraceEventTimelineItemDto[];
}
