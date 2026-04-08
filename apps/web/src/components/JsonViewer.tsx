import { ChevronDown, ChevronUp, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from './ui/button';

interface JsonViewerProps {
  value: unknown;
  title?: string;
}

export function JsonViewer({ value, title }: JsonViewerProps) {
  const [expanded, setExpanded] = useState(true);
  const [copied, setCopied] = useState(false);
  const text = JSON.stringify(value ?? null, null, 2);

  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-slate-950/5">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-3 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title ?? 'Payload'}
        </span>
        <div className="flex gap-1">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded ? (
              <ChevronUp className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" aria-hidden />
            )}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
            <Copy className="h-3.5 w-3.5" aria-hidden />
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>
      </div>
      {expanded && (
        <pre className="max-h-96 overflow-auto bg-slate-950 p-4 font-mono text-xs leading-relaxed text-slate-100">
          {text}
        </pre>
      )}
    </div>
  );
}
