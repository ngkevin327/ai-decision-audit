import {
  CanActivate,
  Controller,
  ExecutionContext,
  Get,
  HttpException,
  HttpStatus,
  Injectable,
  Module,
} from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QuotaService, type QuotaUsageSnapshot } from './quota.service';

function countIncomingEvents(body: unknown): number {
  if (!body || typeof body !== 'object') {
    return 0;
  }
  const spans = (body as { spans?: Array<{ events?: unknown[] }> }).spans;
  if (!Array.isArray(spans)) {
    return 0;
  }
  return spans.reduce((total, span) => total + (span.events?.length ?? 0), 0);
}

@Injectable()
export class QuotaIngestGuard implements CanActivate {
  constructor(
    private readonly quota: QuotaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<{ method?: string; url?: string; body?: unknown }>();
    const handler = context.getHandler();
    const controller = context.getClass();
    const isIngest =
      request.method === 'POST' &&
      typeof request.url === 'string' &&
      request.url.includes('/v1/traces') &&
      controller.name === 'IngestController' &&
      handler.name === 'ingest';

    if (!isIngest) {
      return true;
    }

    const tenant = this.tenantContext.get();
    if (!tenant?.organizationId) {
      return true;
    }

    const incoming = countIncomingEvents(request.body);
    await this.quota.enforceIngest(tenant.organizationId, incoming);
    return true;
  }
}

@Controller('v1/quota')
export class QuotaController {
  constructor(
    private readonly quota: QuotaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get()
  async usage(): Promise<QuotaUsageSnapshot> {
    const tenant = this.tenantContext.get();
    if (!tenant?.organizationId) {
      throw new HttpException('Tenant context required', HttpStatus.UNAUTHORIZED);
    }
    return this.quota.getUsage(tenant.organizationId);
  }
}

@Module({
  imports: [PrismaModule],
  controllers: [QuotaController],
  providers: [
    QuotaService,
    QuotaIngestGuard,
    { provide: APP_GUARD, useExisting: QuotaIngestGuard },
  ],
  exports: [QuotaService, QuotaIngestGuard],
})
export class QuotaModule {}
