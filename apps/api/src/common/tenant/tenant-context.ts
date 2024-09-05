import { Role } from '@prisma/client';

export type AuthMethod = 'jwt' | 'api_key';

export interface TenantContext {
  authMethod: AuthMethod;
  organizationId: string;
  userId?: string;
  role?: Role;
  projectId?: string;
  environmentId?: string;
  scopes: string[];
  apiKeyId?: string;
}

export const TENANT_CONTEXT_KEY = 'tenantContext';
