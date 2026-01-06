import {
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  Inject,
  Injectable,
  Module,
  NotFoundException,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ExportJobStatus } from '@prisma/client';
import { API_SCOPES, ROLE_PERMISSIONS } from '../auth/permission.constants';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaModule } from '../prisma/prisma.module';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../storage/storage.module';
import { STORAGE_SERVICE, type StorageService } from '../storage/storage.interface';

const DOWNLOAD_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class ExportDownloadAuthGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(_context: ExecutionContext): boolean {
    const ctx = this.tenantContext.require();
    if (ctx.authMethod === 'api_key') {
      if (!ctx.scopes.includes(API_SCOPES.EXPORT_CREATE)) {
        throw new ForbiddenException('API key missing export:create scope');
      }
      return true;
    }
    if (ctx.authMethod === 'jwt' && ctx.role && ROLE_PERMISSIONS[ctx.role].export) {
      return true;
    }
    throw new ForbiddenException('Export download requires auditor or org_admin access');
  }
}

@Controller('v1/exports')
@UseGuards(TenantGuard, ExportDownloadAuthGuard)
export class DownloadController {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(STORAGE_SERVICE) private readonly storage: StorageService,
    private readonly tenantContext: TenantContextService,
  ) {}

  @Get(':exportId/download')
  async download(@Param('exportId') exportId: string) {
    const ctx = this.tenantContext.require();
    const job = await this.prisma.exportJob.findFirst({
      where: { id: exportId, organizationId: ctx.organizationId },
    });

    if (!job || job.status !== ExportJobStatus.completed || !job.artifactKey) {
      throw new NotFoundException('Export not ready for download');
    }

    if (job.downloadExpiresAt && job.downloadExpiresAt.getTime() < Date.now()) {
      throw new NotFoundException('Export download link has expired');
    }

    const url = await this.storage.signedUrl(job.artifactKey, DOWNLOAD_TTL_SECONDS);
    return {
      export_id: job.id,
      download_url: url,
      expires_at: job.downloadExpiresAt?.toISOString() ?? null,
      manifest_hash: job.manifestHash,
      chain_hash: job.chainHash,
    };
  }
}

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [DownloadController],
  providers: [ExportDownloadAuthGuard],
})
export class ExportDownloadModule {}
