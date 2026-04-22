import { SignIn } from '@clerk/clerk-react';
import { ArrowRight, Shield } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { isClerkEnabled, useAppAuth } from '../auth/AuthProvider';
import { setDevConsoleEntry } from '../auth/dev-entry';
import { Logo } from '../components/brand/Logo';
import { ThemeToggle } from '../components/ThemeToggle';
import { LoadingState } from '../components/LoadingState';

export function SignInPage() {
  const navigate = useNavigate();
  const clerkEnabled = isClerkEnabled();
  const { isLoaded, isSignedIn } = useAppAuth();

  if (clerkEnabled) {
    if (!isLoaded) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-mesh-gradient">
          <LoadingState label="Loading sign-in" />
        </div>
      );
    }
    if (isSignedIn) {
      return <Navigate to="/" replace />;
    }
  }

  if (!clerkEnabled) {
    return (
      <div className="flex min-h-screen">
        <div className="hidden w-1/2 flex-col justify-between bg-sidebar p-12 lg:flex">
          <Logo size="hero" />
          <div className="space-y-6">
            <h1 className="text-4xl font-semibold leading-tight tracking-tight text-sidebar-foreground">
              Forensic audit trails for production AI
            </h1>
            <p className="max-w-md text-lg leading-relaxed text-sidebar-muted">
              Capture prompts, tool calls, and permission snapshots — then replay every copilot
              decision your customers can question.
            </p>
            <ul className="space-y-3 text-sm text-sidebar-muted">
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" aria-hidden />
                Tamper-evident hash chains
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" aria-hidden />
                Multi-tenant RBAC
              </li>
              <li className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" aria-hidden />
                Auditor-ready exports
              </li>
            </ul>
          </div>
          <p className="text-xs text-sidebar-muted">© AI Audit Trail</p>
        </div>
        <div className="relative flex flex-1 flex-col items-center justify-center bg-mesh-gradient p-8">
          <div className="absolute right-6 top-6">
            <ThemeToggle />
          </div>
          <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8 shadow-card-hover">
            <div className="lg:hidden">
              <Logo variant="light" size="large" className="justify-center" />
            </div>
            <div className="space-y-2 text-center lg:text-left">
              <h2 className="text-xl font-semibold">Local development</h2>
              <p className="text-sm text-muted-foreground">
                Clerk is not configured. Continue to the console without sign-in.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDevConsoleEntry();
                navigate('/');
              }}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-medium text-primary-foreground shadow-md shadow-primary/25 transition hover:bg-primary/90"
            >
              Enter forensic console
              <ArrowRight className="h-4 w-4" aria-hidden />
            </button>
            <p className="text-center text-xs text-muted-foreground">
              For Clerk sign-in, set{' '}
              <code className="rounded bg-muted px-1 py-0.5 font-mono">CLERK_PUBLISHABLE_KEY</code>{' '}
              in the repo root <code className="rounded bg-muted px-1 py-0.5 font-mono">.env</code>{' '}
              and restart <code className="rounded bg-muted px-1 py-0.5 font-mono">pnpm dev</code>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-mesh-gradient p-6">
      <div className="absolute right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-card-hover">
        <div className="mb-8 flex justify-center">
          <Logo variant="light" size="large" />
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-in" fallbackRedirectUrl="/" />
      </div>
    </div>
  );
}
