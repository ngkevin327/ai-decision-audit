import { Navigate, useLocation } from 'react-router-dom';
import { ReactNode } from 'react';
import { LoadingState } from '../components/LoadingState';
import { isClerkEnabled, useAppAuth } from './AuthProvider';
import { hasDevConsoleEntry } from './dev-entry';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();

  if (!isClerkEnabled()) {
    if (!hasDevConsoleEntry()) {
      return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
    }
    return <>{children}</>;
  }

  const { isLoaded, isSignedIn } = useAppAuth();

  if (!isLoaded) {
    return <LoadingState label="Loading session" />;
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
