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
    <form
      onSubmit={onSubmit}
      className="grid gap-3 rounded-lg border border-border bg-card p-4 md:grid-cols-6"
    >
      <Input
        name="q"
        placeholder="Search workflow…"
        defaultValue={value.q ?? ''}
        className="md:col-span-2"
      />
      <Input
        name="workflow_name"
        placeholder="Workflow name"
        defaultValue={value.workflow_name ?? ''}
      />
      <Input name="actor_id" placeholder="Actor ID" defaultValue={value.actor_id ?? ''} />
      <Input name="model" placeholder="Model" defaultValue={value.model ?? ''} />
      <select
        name="status"
        defaultValue={value.status ?? ''}
        className="h-9 rounded-md border border-border bg-card px-3 text-sm"
      >
        <option value="">All statuses</option>
        <option value="in_progress">In progress</option>
        <option value="completed">Completed</option>
        <option value="failed">Failed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <Button type="submit" className="md:col-span-1">
        Apply
      </Button>
    </form>
  );
}
