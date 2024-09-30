import { useAuth, useUser } from '@clerk/clerk-react';
import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';

export function OnboardingPage() {
  const { user } = useUser();
  const { userId } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const ownerExternalId = userId ?? import.meta.env.VITE_DEV_USER_ID ?? 'dev_user';
    const ownerEmail = user?.primaryEmailAddress?.emailAddress ?? 'owner@example.com';

    try {
      const response = await fetch(`${API_BASE}/public/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          ownerExternalId,
          ownerEmail,
          ownerDisplayName: user?.fullName ?? undefined,
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
    }
  }

  return (
    <section>
      <h2>Create your organization</h2>
      <p>Set up your workspace, default project, and staging environment.</p>
      <form onSubmit={onSubmit} className="settings-form">
        <label>
          Organization name
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </label>
        <label>
          URL slug
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required />
        </label>
        <button type="submit">Complete setup</button>
      </form>
      {error && <p className="error">{error}</p>}
    </section>
  );
}
