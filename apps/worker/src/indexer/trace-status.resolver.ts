import { Injectable } from '@nestjs/common';
import { EventType, TraceStatus } from '@prisma/client';

interface TraceEventsInput {
  status: TraceStatus;
  spans: Array<{
    events: Array<{ type: EventType }>;
  }>;
}

@Injectable()
export class TraceStatusResolver {
  resolve(trace: TraceEventsInput): TraceStatus {
    const eventTypes = trace.spans.flatMap((span) => span.events.map((event) => event.type));

    if (eventTypes.includes(EventType.approval) && trace.status === TraceStatus.cancelled) {
      return TraceStatus.cancelled;
    }

    if (
      eventTypes.some((type) => type === EventType.custom && trace.status === TraceStatus.failed)
    ) {
      return TraceStatus.failed;
    }

    if (trace.status === TraceStatus.failed || trace.status === TraceStatus.cancelled) {
      return trace.status;
    }

    if (eventTypes.includes(EventType.completion)) {
      return TraceStatus.completed;
    }

    return TraceStatus.in_progress;
  }
}
