import { Filter } from 'lucide-react';
import { FormEvent } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import type { TraceSearchParams } from '../../api/traces';

interface TraceFiltersProps {
  value: TraceSearchParams;
  onChange: (next: TraceSearchParams) => void;
}

export function TraceFilters({ value, onChange }: TraceFiltersProps) {
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onChange({
      ...value,
      q: String(form.get('q') ?? ''),
      workflow_name: String(form.get('workflow_name') ?? ''),
      status: String(form.get('status') ?? '') || undefined,
      actor_id: String(form.get('actor_id') ?? ''),
      model: String(form.get('model') ?? ''),
    });
  }

  return (
    <form onSubmit={onSubmit} className="surface-card grid gap-4 p-5 md:grid-cols-6 md:items-end">
      <div className="flex items-center gap-2 md:col-span-6">
        <Filter className="h-4 w-4 text-primary" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Filters
        </span>
      </div>
      <div className="md:col-span-2">
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search</label>
        <Input name="q" placeholder="Workflow, tags…" defaultValue={value.q ?? ''} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Workflow</label>
        <Input
          name="workflow_name"
          placeholder="e.g. support_refund"
          defaultValue={value.workflow_name ?? ''}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Actor</label>
        <Input name="actor_id" placeholder="Actor ID" defaultValue={value.actor_id ?? ''} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Model</label>
        <Input name="model" placeholder="gpt-4o" defaultValue={value.model ?? ''} />
      </div>
      <div>
        <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Status</label>
        <select name="status" defaultValue={value.status ?? ''} className="select-field">
          <option value="">All statuses</option>
          <option value="in_progress">In progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>
      <Button type="submit" className="md:col-span-1">
        Apply filters
      </Button>
    </form>
  );
}
