import type { TraceEvent } from '../../api/traces';
import { JsonViewer } from '../../components/JsonViewer';

interface EventTimelineProps {
  events: TraceEvent[];
  highlightEventId?: string;
}

const typeColors: Record<string, string> = {
  prompt: 'bg-violet-100 text-violet-800',
  completion: 'bg-emerald-100 text-emerald-800',
  tool_call: 'bg-blue-100 text-blue-800',
  retrieval: 'bg-cyan-100 text-cyan-800',
  approval: 'bg-amber-100 text-amber-800',
  custom: 'bg-slate-100 text-slate-700',
};

export function EventTimeline({ events, highlightEventId }: EventTimelineProps) {
  return (
    <ol className="relative space-y-0">
      <div className="absolute bottom-2 left-[11px] top-2 w-px bg-border" aria-hidden />
      {events.map((event, index) => {
        const highlighted = event.event_id === highlightEventId;
        const typeClass = typeColors[event.type] ?? typeColors.custom;

        return (
          <li key={event.event_id} id={`event-${event.event_id}`} className="relative pl-8">
            <span
              className={`absolute left-0 top-5 flex h-6 w-6 items-center justify-center rounded-full border-2 text-[10px] font-bold ${
                highlighted
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
              aria-hidden
            >
              {index + 1}
            </span>
            <div
              className={`mb-4 rounded-xl border p-4 transition-shadow ${
                highlighted
                  ? 'border-primary/50 bg-primary/5 shadow-glow'
                  : 'border-border bg-card/80 hover:shadow-card'
              }`}
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${typeClass}`}
                >
                  {event.type.replace(/_/g, ' ')}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{event.event_id}</span>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {new Date(event.occurred_at).toLocaleString()}
                </span>
              </div>
              <p className="mb-2 text-xs text-muted-foreground">
                {event.span_name} · <span className="font-mono">{event.span_id}</span>
              </p>
              <JsonViewer value={event.payload} title="Event payload" />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
