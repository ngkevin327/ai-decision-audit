import { SignIn } from '@clerk/clerk-react';

export function SignInPage() {
  const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

  if (!publishableKey) {
    return (
      <section>
        <h2>Sign in</h2>
        <p>Set VITE_CLERK_PUBLISHABLE_KEY to enable Clerk authentication.</p>
      </section>
    );
  }

  return (
    <section className="auth-panel">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </section>
  );
}
