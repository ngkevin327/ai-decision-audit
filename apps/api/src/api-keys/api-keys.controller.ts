import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../common/guards/tenant.guard';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto } from './dto/create-api-key.dto';

@Controller('organizations/:orgId/api-keys')
@UseGuards(TenantGuard)
export class ApiKeysController {
  constructor(private readonly apiKeys: ApiKeysService) {}

  @Post()
  create(@Param('orgId') orgId: string, @Body() dto: CreateApiKeyDto) {
    return this.apiKeys.create(orgId, dto);
  }

  @Get()
  list(@Param('orgId') orgId: string, @Query('projectId') projectId?: string) {
    return this.apiKeys.list(orgId, projectId);
  }

  @Delete(':keyId')
  revoke(@Param('orgId') orgId: string, @Param('keyId') keyId: string) {
    return this.apiKeys.revoke(orgId, keyId);
  }
}
