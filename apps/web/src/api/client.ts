const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3100';

export interface ApiRequestOptions {
  orgId: string;
  userId?: string;
  token?: string;
}

function buildHeaders(options: ApiRequestOptions): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Organization-Id': options.orgId,
  };
  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  } else if (options.userId) {
    headers['X-User-Id'] = options.userId;
  }
  return headers;
}

export async function apiFetch<T>(
  path: string,
  options: ApiRequestOptions,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(options),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}
