import { useAuth } from '@clerk/clerk-react';
import { useCallback, useMemo } from 'react';
import { apiFetch } from './client';

export interface Project {
  id: string;
  name: string;
  slug: string;
  environments: { id: string; name: string }[];
}

export interface ApiKeySummary {
  id: string;
  name: string;
  keyPrefix: string;
  scopes: string[];
  projectId: string;
  createdAt: string;
}

export function useApiContext() {
  const { userId, getToken } = useAuth();
  const orgId = import.meta.env.VITE_DEFAULT_ORG_ID ?? '';

  const context = useMemo(
    () => ({
      orgId,
      userId: userId ?? import.meta.env.VITE_DEV_USER_ID ?? 'dev_user',
      getToken,
    }),
    [orgId, userId, getToken],
  );

  const request = useCallback(
    async <T>(path: string, init?: RequestInit) => {
      const token = context.getToken ? await context.getToken() : undefined;
      return apiFetch<T>(
        path,
        { orgId: context.orgId, userId: context.userId, token: token ?? undefined },
        init,
      );
    },
    [context],
  );

  return { ...context, request };
}

export function useProjects() {
  const { orgId, request } = useApiContext();

  const list = useCallback(() => {
    return request<Project[]>(`/organizations/${orgId}/projects`);
  }, [orgId, request]);

  const create = useCallback(
    (name: string, slug: string) => {
      return request<Project>(`/organizations/${orgId}/projects`, {
        method: 'POST',
        body: JSON.stringify({ name, slug }),
      });
    },
    [orgId, request],
  );

  return { list, create };
}

export function useApiKeys() {
  const { orgId, request } = useApiContext();

  const list = useCallback(
    (projectId?: string) => {
      const query = projectId ? `?projectId=${projectId}` : '';
      return request<ApiKeySummary[]>(`/organizations/${orgId}/api-keys${query}`);
    },
    [orgId, request],
  );

  const create = useCallback(
    (payload: { name: string; projectId: string; environmentId?: string; scopes: string[] }) => {
      return request<{ plaintextKey: string } & ApiKeySummary>(`/organizations/${orgId}/api-keys`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    },
    [orgId, request],
  );

  return { list, create };
}
