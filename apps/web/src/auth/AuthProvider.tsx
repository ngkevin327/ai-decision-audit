import { ClerkProvider, useAuth } from '@clerk/clerk-react';
import { createContext, ReactNode, useContext, useMemo } from 'react';

export interface AppAuthValue {
  isLoaded: boolean;
  isSignedIn: boolean;
  userId: string | null;
  getToken?: () => Promise<string | null>;
}

const AppAuthContext = createContext<AppAuthValue | null>(null);

const publishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY?.trim() ||
  (import.meta.env as { CLERK_PUBLISHABLE_KEY?: string }).CLERK_PUBLISHABLE_KEY?.trim() ||
  '';
const devUserId = import.meta.env.VITE_DEV_USER_ID ?? 'dev_user';

const devAuthValue: AppAuthValue = {
  isLoaded: true,
  isSignedIn: true,
  userId: devUserId,
};

function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();
  const value = useMemo<AppAuthValue>(
    () => ({
      isLoaded,
      isSignedIn: Boolean(isSignedIn),
      userId: userId ?? null,
      getToken,
    }),
    [isLoaded, isSignedIn, userId, getToken],
  );
  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!publishableKey) {
    return <AppAuthContext.Provider value={devAuthValue}>{children}</AppAuthContext.Provider>;
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      signInUrl="/sign-in"
      signUpUrl="/sign-in"
      afterSignInUrl="/"
      afterSignUpUrl="/onboarding"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}

export function useAppAuth(): AppAuthValue {
  const ctx = useContext(AppAuthContext);
  if (!ctx) {
    throw new Error('useAppAuth must be used within AuthProvider');
  }
  return ctx;
}

export function isClerkEnabled() {
  return publishableKey.length > 0;
}
