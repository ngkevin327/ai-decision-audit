import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../common/guards/tenant.guard';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(TenantGuard)
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Get(':orgId')
  findOne(@Param('orgId') orgId: string) {
    return this.organizations.findById(orgId);
  }
}
