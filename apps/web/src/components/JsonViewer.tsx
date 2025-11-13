import { useState } from 'react';
import { Button } from './ui/button';

interface JsonViewerProps {
  value: unknown;
  title?: string;
}

export function JsonViewer({ value, title }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(true);
  const text = JSON.stringify(value ?? null, null, 2);

  async function copy() {
    await navigator.clipboard.writeText(text);
  }

  return (
    <div className="rounded-md border border-border bg-muted/30">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground">{title ?? 'Payload'}</span>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
            Copy
          </Button>
        </div>
      </div>
      {expanded && (
        <pre className="max-h-96 overflow-auto p-3 font-mono text-xs leading-relaxed">{text}</pre>
      )}
    </div>
  );
}
