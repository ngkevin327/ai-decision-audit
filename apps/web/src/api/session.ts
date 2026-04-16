const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100';

export interface LinkSessionResponse {
  organization: { id: string; name: string; slug: string };
  user: { id: string; externalId: string; email: string; displayName: string | null };
  membership: { role: string };
}

export async function linkClerkSession(
  getToken: () => Promise<string | null>,
  organizationId?: string,
): Promise<LinkSessionResponse> {
  const token = await getToken();
  if (!token) {
    throw new Error('Not signed in');
  }

  const response = await fetch(`${API_BASE}/public/auth/session`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      organizationId: organizationId ?? import.meta.env.VITE_DEFAULT_ORG_ID ?? undefined,
    }),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Session link failed (${response.status})`);
  }

  return response.json() as Promise<LinkSessionResponse>;
}
