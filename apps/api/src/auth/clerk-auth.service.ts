import { verifyToken } from '@clerk/backend';
import { Injectable, UnauthorizedException } from '@nestjs/common';

interface ClerkJwtPayload {
  sub?: string;
  email?: string;
  name?: string;
  primary_email_address?: string;
  full_name?: string;
}
import { AppConfigService } from '../config/config.service';

export interface VerifiedClerkSession {
  externalUserId: string;
  email: string | null;
  displayName: string | null;
}

@Injectable()
export class ClerkAuthService {
  constructor(private readonly config: AppConfigService) {}

  isEnabled() {
    return this.config.clerkEnabled;
  }

  async verifyBearerToken(token: string): Promise<VerifiedClerkSession> {
    const secretKey = this.config.clerkSecretKey;
    if (!secretKey) {
      throw new UnauthorizedException('Clerk is not configured on the API');
    }

    try {
      const result = await verifyToken(token, { secretKey });
      const payload = result.data as ClerkJwtPayload | undefined;
      if (!payload?.sub) {
        throw new UnauthorizedException('Invalid or expired Clerk session');
      }

      const email =
        typeof payload.email === 'string' ? payload.email : (payload.primary_email_address ?? null);

      const displayName =
        typeof payload.name === 'string' ? payload.name : (payload.full_name ?? null);

      return {
        externalUserId: payload.sub,
        email: email ?? null,
        displayName,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired Clerk session');
    }
  }
}
