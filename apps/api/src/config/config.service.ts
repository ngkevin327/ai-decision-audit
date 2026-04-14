import { Injectable } from '@nestjs/common';
import { envSchema, type EnvConfig } from './env.schema';

@Injectable()
export class AppConfigService {
  readonly env: EnvConfig;

  constructor() {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const details = parsed.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join('; ');
      throw new Error(`Invalid environment configuration: ${details}`);
    }
    this.env = parsed.data;
  }

  get port() {
    return this.env.PORT;
  }

  get databaseUrl() {
    return this.env.DATABASE_URL;
  }

  get redisUrl() {
    return this.env.REDIS_URL;
  }

  get storageDriver() {
    return this.env.STORAGE_DRIVER;
  }

  get clerkSecretKey() {
    return this.env.CLERK_SECRET_KEY;
  }

  get clerkEnabled() {
    return Boolean(this.env.CLERK_SECRET_KEY?.trim());
  }

  get localDevOrgId() {
    return this.env.LOCAL_DEV_ORG_ID;
  }

  get isDevelopment() {
    return this.env.NODE_ENV === 'development';
  }
}
