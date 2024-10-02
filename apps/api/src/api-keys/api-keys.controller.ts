import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/permissions.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { TenantScopeGuard } from '../common/guards/tenant-scope.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('organizations/:orgId/api-keys')
@UseGuards(TenantGuard, TenantScopeGuard, RolesGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Post()
  @Roles('org_admin', 'developer')
  create(@Param('orgId') orgId: string, @Body() dto: CreateApiKeyDto) {
    return this.apiKeys.create(orgId, dto);
  }

  @Get()
  @Roles('org_admin', 'developer', 'auditor')
  list(@Param('orgId') orgId: string, @Query('projectId') projectId?: string) {
    return this.apiKeys.list(orgId, projectId);
  }

  @Delete(':keyId')
  @Roles('org_admin')
  revoke(@Param('orgId') orgId: string, @Param('keyId') keyId: string) {
    return this.apiKeys.revoke(orgId, keyId);
  }
}
