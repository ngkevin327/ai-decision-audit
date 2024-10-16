import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { MembershipsModule } from './memberships/memberships.module';
import { MetaAuditModule } from './meta-audit/meta-audit.module';
import { ValidationModule } from './validation/validation.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    AuthModule,
    PrismaModule,
    StorageModule,
    QueueModule,
    OrganizationsModule,
    ProjectsModule,
    ApiKeysModule,
    MembershipsModule,
    MetaAuditModule,
    ValidationModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantContextMiddleware).forRoutes('*');
  }
}
