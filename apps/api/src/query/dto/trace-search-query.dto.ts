import { TraceStatus } from '@prisma/client';

export interface TraceSearchQueryDto {
  projectId?: string;
  status?: TraceStatus;
  workflowName?: string;
  actorId?: string;
  model?: string;
  tagKey?: string;
  tagValue?: string;
  q?: string;
  startedAfter?: string;
  startedBefore?: string;
  limit?: number;
  cursor?: string;
}
