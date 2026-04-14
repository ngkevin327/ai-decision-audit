import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAppAuth } from '../auth/AuthProvider';
import { apiFetch } from './client';
import { fetchReplay, fetchTraceDetail, fetchTraces, type TraceSearchParams } from './traces';

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
  const { userId, getToken } = useAppAuth();
  const orgId =
    (typeof localStorage !== 'undefined' ? localStorage.getItem('defaultOrgId') : null) ??
    import.meta.env.VITE_DEFAULT_ORG_ID ??
    '';

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

export function useTraceSearch(params: TraceSearchParams) {
  const { request } = useApiContext();
  return useQuery({
    queryKey: ['traces', params],
    queryFn: () => fetchTraces(request, params),
    enabled: Boolean(params.project_id),
  });
}

export function useTraceDetail(traceId: string | undefined) {
  const { request } = useApiContext();
  return useQuery({
    queryKey: ['trace', traceId],
    queryFn: () => fetchTraceDetail(request, traceId!),
    enabled: Boolean(traceId),
  });
}

export function useReplay(traceId: string | undefined) {
  const { request } = useApiContext();
  return useQuery({
    queryKey: ['replay', traceId],
    queryFn: () => fetchReplay(request, traceId!),
    enabled: Boolean(traceId),
  });
}

export const PROJECT_STORAGE_KEY = 'selectedProjectId';
export const ENVIRONMENT_STORAGE_KEY = 'selectedEnvironmentId';

export function useSelectedProject() {
  const readProject = () =>
    typeof localStorage !== 'undefined'
      ? (localStorage.getItem(PROJECT_STORAGE_KEY) ?? undefined)
      : undefined;

  const [projectId, setProjectIdState] = useState<string | undefined>(readProject);

  useEffect(() => {
    const onChange = () => setProjectIdState(readProject());
    window.addEventListener('project-changed', onChange);
    return () => window.removeEventListener('project-changed', onChange);
  }, []);

  const setProjectId = useCallback((id: string) => {
    localStorage.setItem(PROJECT_STORAGE_KEY, id);
    setProjectIdState(id);
    window.dispatchEvent(new Event('project-changed'));
  }, []);

  return { projectId, setProjectId };
}
