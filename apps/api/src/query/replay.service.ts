import { Injectable } from '@nestjs/common';
import type { ReplayTimelineDto } from './dto/replay.dto';
import { TraceDetailService } from './trace-detail.service';

@Injectable()
export class ReplayService {
  constructor(private readonly traceDetail: TraceDetailService) {}

  async getTimeline(traceId: string): Promise<ReplayTimelineDto> {
    const detail = await this.traceDetail.getDetail(traceId);
    const steps = detail.events.map((event, index) => ({
      event_id: event.event_id,
      type: event.type,
      occurred_at: event.occurred_at,
      span_id: event.span_id,
      span_name: event.span_name,
      payload: event.payload,
      prev_event_id: index > 0 ? detail.events[index - 1].event_id : null,
      next_event_id: index < detail.events.length - 1 ? detail.events[index + 1].event_id : null,
    }));

    return {
      trace_id: detail.trace_id,
      workflow_name: detail.workflow_name,
      permission_snapshot: detail.permission_snapshot,
      steps,
    };
  }
}
