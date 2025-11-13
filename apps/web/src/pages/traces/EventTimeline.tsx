import type { TraceEvent } from '../../api/traces';
import { JsonViewer } from '../../components/JsonViewer';
import { Badge } from '../../components/ui/badge';

interface EventTimelineProps {
  events: TraceEvent[];
  highlightEventId?: string;
}

export function EventTimeline({ events, highlightEventId }: EventTimelineProps) {
  return (
    <ol className="space-y-4">
      {events.map((event) => {
        const highlighted = event.event_id === highlightEventId;
        return (
          <li
            key={event.event_id}
            id={`event-${event.event_id}`}
            className={`rounded-lg border p-4 ${highlighted ? 'border-primary bg-primary/5' : 'border-border bg-card'}`}
          >
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge>{event.type}</Badge>
              <span className="font-mono text-xs text-muted-foreground">{event.event_id}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(event.occurred_at).toLocaleString()}
              </span>
              <span className="text-xs text-muted-foreground">
                {event.span_name} ({event.span_id})
              </span>
            </div>
            <JsonViewer value={event.payload} title="Event payload" />
          </li>
        );
      })}
    </ol>
  );
}
