import { useQuery } from '@tanstack/react-query';
import { useApiContext } from '../../api/hooks';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';

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

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Plan tier, monthly event quota, and current period usage.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && <p className="text-sm text-muted-foreground">Loading usage…</p>}
          {error && <p className="text-sm text-red-600">{error.message}</p>}
          {data && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Plan tier</span>
                <span className="font-medium capitalize">{data.plan_tier}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Events this month</span>
                <span className="font-mono">
                  {data.events_used.toLocaleString()} / {data.monthly_limit.toLocaleString()}
                </span>
              </div>
              <div>
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>{data.percent_used}% used</span>
                  <span>Resets {new Date(data.period_end).toLocaleDateString()}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full ${data.limit_reached ? 'bg-red-600' : data.warning_threshold ? 'bg-amber-500' : 'bg-primary'}`}
                    style={{ width: `${Math.min(100, data.percent_used)}%` }}
                  />
                </div>
              </div>
              {data.warning_threshold && !data.limit_reached && (
                <p className="text-sm text-amber-700">
                  You have used 80% or more of your monthly event quota. Ingest will block at 100%.
                </p>
              )}
              {data.limit_reached && (
                <p className="text-sm text-red-600">
                  Monthly quota reached. Upgrade your plan or wait until the next billing period.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
