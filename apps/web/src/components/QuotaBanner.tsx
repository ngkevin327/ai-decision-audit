import { useQuery } from '@tanstack/react-query';
import { AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApiContext } from '../api/hooks';

interface QuotaUsage {
  limit_reached: boolean;
  warning_threshold: boolean;
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

  if (!data?.limit_reached && !data?.warning_threshold) {
    return null;
  }

  const isBlocked = data.limit_reached;

  return (
    <div
      role="alert"
      className={
        isBlocked
          ? 'border-b border-red-200/80 bg-gradient-to-r from-red-50 to-red-50/50 px-6 py-2.5'
          : 'border-b border-amber-200/80 bg-gradient-to-r from-amber-50 to-amber-50/50 px-6 py-2.5'
      }
    >
      <div className="mx-auto flex max-w-6xl items-center gap-2 text-sm">
        <AlertTriangle
          className={`h-4 w-4 shrink-0 ${isBlocked ? 'text-red-600' : 'text-amber-600'}`}
          aria-hidden
        />
        <p className={isBlocked ? 'text-red-900' : 'text-amber-900'}>
          {isBlocked ? (
            <>
              Monthly event quota reached ({data.events_used.toLocaleString()} /{' '}
              {data.monthly_limit.toLocaleString()}). Ingest is blocked.
            </>
          ) : (
            <>
              {data.percent_used}% of monthly quota used ({data.events_used.toLocaleString()} /{' '}
              {data.monthly_limit.toLocaleString()}).
            </>
          )}{' '}
          <Link
            to="/settings/billing"
            className="font-semibold underline underline-offset-2 hover:opacity-80"
          >
            View billing
          </Link>
        </p>
      </div>
    </div>
  );
}
