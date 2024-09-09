import { Role } from '@prisma/client';

export const API_SCOPES = {
  TRACE_INGEST: 'trace:ingest',
  TRACE_READ: 'trace:read',
  EXPORT_CREATE: 'export:create',
  ADMIN: 'admin',
} as const;

export type ApiScope = (typeof API_SCOPES)[keyof typeof API_SCOPES];

export const ROLE_PERMISSIONS: Record<
  Role,
  { ingest: boolean; search: boolean; export: boolean; admin: boolean }
> = {
  org_admin: { ingest: true, search: true, export: true, admin: true },
  developer: { ingest: true, search: true, export: false, admin: false },
  auditor: { ingest: false, search: true, export: true, admin: false },
  viewer: { ingest: false, search: true, export: false, admin: false },
};

export function roleToScopes(role: Role): string[] {
  const perms = ROLE_PERMISSIONS[role];
  const scopes: string[] = [];
  if (perms.ingest) scopes.push(API_SCOPES.TRACE_INGEST);
  if (perms.search) scopes.push(API_SCOPES.TRACE_READ);
  if (perms.export) scopes.push(API_SCOPES.EXPORT_CREATE);
  if (perms.admin) scopes.push(API_SCOPES.ADMIN);
  return scopes;
}
