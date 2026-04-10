import { useQuery } from '@tanstack/react-query';
import { CreditCard, TrendingUp } from 'lucide-react';
import { useApiContext } from '../../api/hooks';
import { PageHeader } from '../../components/layout/PageHeader';
import { StatCard } from '../../components/layout/StatCard';
import { SettingsCard } from '../../components/layout/SettingsCard';
import { Alert } from '../../components/ui/alert';

interface QuotaUsage {
  plan_tier: string;
  monthly_limit: number;
  events_used: number;
  percent_used: number;
  warning_threshold: boolean;
  limit_reached: boolean;
  period_start: string;
  period_end: string;
}

export function BillingPage() {
  const { request } = useApiContext();
  const { data, isLoading, error } = useQuery({
    queryKey: ['quota'],
    queryFn: () => request<QuotaUsage>('/v1/quota'),
  });

  const barColor = data?.limit_reached
    ? 'bg-danger'
    : data?.warning_threshold
      ? 'bg-warning'
      : 'bg-primary';

  return (
    <div className="page-container max-w-4xl">
      <PageHeader
        title="Billing & usage"
        description="Monitor plan tier, monthly event quota, and billing period for your organization."
      />

      <div className="grid gap-4 md:grid-cols-2">
        <StatCard
          label="Plan tier"
          value={isLoading ? '—' : (data?.plan_tier ?? '—')}
          hint="Current subscription"
          icon={CreditCard}
        />
        <StatCard
          label="Events used"
          value={isLoading ? '—' : data ? `${data.events_used.toLocaleString()}` : '—'}
          hint={
            data ? `of ${data.monthly_limit.toLocaleString()} this period` : 'Monthly ingest quota'
          }
          icon={TrendingUp}
          trend={data && !data.limit_reached ? 'up' : undefined}
        />
      </div>

      <SettingsCard title="Usage this period">
        {isLoading && <p className="text-sm text-muted-foreground">Loading usage…</p>}
        {error && <Alert variant="error">{error.message}</Alert>}
        {data && (
          <div className="space-y-5">
            <div>
              <div className="mb-2 flex justify-between text-sm">
                <span className="font-medium">{data.percent_used}% used</span>
                <span className="text-muted-foreground">
                  Resets {new Date(data.period_end).toLocaleDateString()}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(100, data.percent_used)}%` }}
                />
              </div>
            </div>
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">Period start</dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {new Date(data.period_start).toLocaleDateString()}
                </dd>
              </div>
              <div className="rounded-lg bg-muted/30 p-3">
                <dt className="text-xs text-muted-foreground">Period end</dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {new Date(data.period_end).toLocaleDateString()}
                </dd>
              </div>
            </dl>
            {data.warning_threshold && !data.limit_reached && (
              <Alert variant="warning" title="Approaching quota limit">
                You have used 80% or more of your monthly quota. Ingest will block at 100%.
              </Alert>
            )}
            {data.limit_reached && (
              <Alert variant="error" title="Monthly quota reached">
                Upgrade your plan or wait until the next billing period.
              </Alert>
            )}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
