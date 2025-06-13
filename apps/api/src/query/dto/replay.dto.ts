import { EventType } from '@prisma/client';
import type { PermissionSnapshotDto } from './trace-detail.dto';

export interface ReplayStepDto {
  event_id: string;
  type: EventType;
  occurred_at: string;
  span_id: string;
  span_name: string;
  payload: unknown | null;
  prev_event_id: string | null;
  next_event_id: string | null;
}

export interface ReplayTimelineDto {
  trace_id: string;
  workflow_name: string;
  permission_snapshot: PermissionSnapshotDto | null;
  steps: ReplayStepDto[];
}
