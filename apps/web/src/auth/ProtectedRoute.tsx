import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { isClerkEnabled, useAppAuth } from './AuthProvider';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  if (!isClerkEnabled()) {
    return <>{children}</>;
  }

  const { isLoaded, isSignedIn } = useAppAuth();

  if (!isLoaded) {
    return <p>Loading session…</p>;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <>{children}</>;
}
