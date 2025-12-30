import {
  Body,
  CanActivate,
  Controller,
  ExecutionContext,
  ForbiddenException,
  Get,
  HttpCode,
  Injectable,
  Module,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { API_SCOPES, ROLE_PERMISSIONS } from '../auth/permission.constants';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PrismaModule } from '../prisma/prisma.module';
import { QueueModule } from '../queue/queue.module';
import { ExportsService, type CreateExportInput, type ExportJobResponse } from './exports.service';

@Injectable()
export class ExportAuthGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  canActivate(_context: ExecutionContext): boolean {
    const ctx = this.tenantContext.require();

    if (ctx.authMethod === 'api_key') {
      if (!ctx.scopes.includes(API_SCOPES.EXPORT_CREATE)) {
        throw new ForbiddenException('API key missing export:create scope');
      }
      return true;
    }

    if (ctx.authMethod === 'jwt' && ctx.role) {
      if (!ROLE_PERMISSIONS[ctx.role].export) {
        throw new ForbiddenException('Role does not allow export creation');
      }
      return true;
    }

    throw new ForbiddenException('Export requires auditor or org_admin access');
  }
}

@Controller('v1/exports')
@UseGuards(TenantGuard, ExportAuthGuard)
export class ExportsController {
  constructor(private readonly exports: ExportsService) {}

  @Post()
  @HttpCode(202)
  async create(@Body() body: CreateExportInput): Promise<ExportJobResponse> {
    return this.exports.createExport(body);
  }

  @Get()
  async list(): Promise<{ exports: ExportJobResponse[] }> {
    const exports = await this.exports.listExports();
    return { exports };
  }

  @Get(':exportId')
  async get(@Param('exportId') exportId: string): Promise<ExportJobResponse> {
    return this.exports.getExport(exportId);
  }
}

@Module({
  imports: [PrismaModule, QueueModule],
  controllers: [ExportsController],
  providers: [ExportsService, ExportAuthGuard],
  exports: [ExportsService],
})
export class ExportsModule {}
