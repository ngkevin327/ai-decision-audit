import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { BodySizeLimitMiddleware } from './common/middleware/body-size-limit.middleware';
import { RateLimitMiddleware } from './common/middleware/rate-limit.middleware';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AppConfigModule } from './config/config.module';
import { HealthModule } from './health/health.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { MembershipsModule } from './memberships/memberships.module';
import { MetaAuditModule } from './meta-audit/meta-audit.module';
import { IngestModule } from './ingest/ingest.module';
import { QueryModule } from './query/query.module';
import { MetricsModule } from './metrics/metrics.module';
import { TracesModule } from './traces/traces.module';
import { ExportsModule } from './exports/exports.controller';
import { ExportDownloadModule } from './exports/download.controller';
import { ValidationModule } from './validation/validation.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ProjectsModule } from './projects/projects.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { StorageModule } from './storage/storage.module';
import { QuotaModule } from './quotas/middleware';

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
    MetricsModule,
    IngestModule,
    QueryModule,
    TracesModule,
    ExportsModule,
    ExportDownloadModule,
    QuotaModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BodySizeLimitMiddleware, RateLimitMiddleware, TenantContextMiddleware)
      .exclude('health', 'health/(.*)', 'openapi.yaml', 'docs', 'metrics')
      .forRoutes('*');
  }
}
