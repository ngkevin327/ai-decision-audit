import { useEffect, useState } from 'react';
import { linkClerkSession } from '../api/session';
import { LoadingState } from '../components/LoadingState';
import { Alert } from '../components/ui/alert';
import { isClerkEnabled, useAppAuth } from './AuthProvider';

const ORG_STORAGE_KEY = 'defaultOrgId';

export function AuthBootstrap({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAppAuth();
  const [ready, setReady] = useState(!isClerkEnabled());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isClerkEnabled()) {
      setReady(true);
      return;
    }

    if (!isLoaded) return;

    if (!isSignedIn) {
      setReady(true);
      return;
    }

    if (!getToken) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setError(null);
    setReady(false);

    linkClerkSession(getToken)
      .then((result) => {
        if (cancelled) return;
        localStorage.setItem(ORG_STORAGE_KEY, result.organization.id);
        setReady(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : 'Failed to link session');
        setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, getToken]);

  if (!ready) {
    return <LoadingState label="Linking your account to the local organization" />;
  }

  if (error && isSignedIn) {
    return (
      <div className="page-container py-12">
        <Alert variant="error" title="Could not link Clerk session">
          {error}
          <p className="mt-2 text-xs opacity-90">
            Ensure API has CLERK_SECRET_KEY matching the web app, run pnpm bootstrap:local, and set
            LOCAL_DEV_ORG_ID in .env.
          </p>
        </Alert>
      </div>
    );
  }

  return <>{children}</>;
}
