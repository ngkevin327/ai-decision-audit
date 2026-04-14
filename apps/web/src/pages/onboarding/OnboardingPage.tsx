import { useUser } from '@clerk/clerk-react';
import { isClerkEnabled, useAppAuth } from '../../auth/AuthProvider';
import { Building2 } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '../../components/brand/Logo';
import { FormField, SettingsCard } from '../../components/layout/SettingsCard';
import { Alert } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100';

function ClerkOnboardingForm() {
  const { user } = useUser();
  return <OnboardingForm clerkUser={user} />;
}

type ClerkUser = ReturnType<typeof useUser>['user'];

function OnboardingForm({ clerkUser }: { clerkUser: ClerkUser }) {
  const { userId } = useAppAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const ownerExternalId = userId ?? import.meta.env.VITE_DEV_USER_ID ?? 'dev_user';
    const ownerEmail = clerkUser?.primaryEmailAddress?.emailAddress ?? 'owner@example.com';

    try {
      const response = await fetch(`${API_BASE}/public/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          ownerExternalId,
          ownerEmail,
          ownerDisplayName: clerkUser?.fullName ?? undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      const result = await response.json();
      localStorage.setItem('defaultOrgId', result.organization.id);
      navigate('/settings/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Onboarding failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-mesh-gradient p-6">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <Logo variant="light" className="justify-center" />
        </div>
        <SettingsCard
          title="Create your organization"
          description="Set up your workspace with a default project and staging environment."
        >
          <form onSubmit={onSubmit} className="space-y-4">
            <FormField label="Organization name">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </FormField>
            <FormField label="URL slug">
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-corp"
                className="font-mono"
                required
              />
            </FormField>
            {error && <Alert variant="error">{error}</Alert>}
            <Button type="submit" disabled={submitting} className="w-full">
              <Building2 className="h-4 w-4" aria-hidden />
              {submitting ? 'Setting up…' : 'Complete setup'}
            </Button>
          </form>
        </SettingsCard>
      </div>
    </div>
  );
}

export function OnboardingPage() {
  if (isClerkEnabled()) {
    return <ClerkOnboardingForm />;
  }
  return <OnboardingForm clerkUser={null} />;
}
