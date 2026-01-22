import { useQuery } from '@tanstack/react-query';
import { useApiContext } from '../api/hooks';

interface QuotaUsage {
  limit_reached: boolean;
  percent_used: number;
  events_used: number;
  monthly_limit: number;
}

export function QuotaBanner() {
  const { request } = useApiContext();
  const { data } = useQuery({
    queryKey: ['quota'],
    queryFn: () => request<QuotaUsage>('/v1/quota'),
    refetchInterval: 60_000,
  });

  if (!data?.limit_reached) {
    return null;
  }

  return (
    <div role="alert" className="border-b border-red-200 bg-red-50 px-6 py-2 text-sm text-red-900">
      Monthly event quota reached ({data.events_used.toLocaleString()} /{' '}
      {data.monthly_limit.toLocaleString()}). Ingest is blocked until the next billing period or
      plan upgrade.{' '}
      <a href="/settings/billing" className="font-medium underline">
        View billing
      </a>
    </div>
  );
}
