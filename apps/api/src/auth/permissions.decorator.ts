import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';
export const SCOPES_KEY = 'scopes';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const RequireScope = (...scopes: string[]) => SetMetadata(SCOPES_KEY, scopes);
