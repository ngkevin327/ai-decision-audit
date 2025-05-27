import { TraceStatus } from '@prisma/client';

export interface TraceListItemDto {
  trace_id: string;
  workflow_name: string;
  status: TraceStatus;
  started_at: string;
  received_at: string;
  completed_at: string | null;
  project_id: string;
  chain_hash: string | null;
}

export interface TraceListResponseDto {
  traces: TraceListItemDto[];
  next_cursor: string | null;
}
