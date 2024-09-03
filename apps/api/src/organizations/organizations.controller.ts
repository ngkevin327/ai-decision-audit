import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizations: OrganizationsService) {}

  @Post()
  create(@Body() dto: CreateOrganizationDto) {
    return this.organizations.create(dto);
  }

  @Get(':orgId')
  findOne(@Param('orgId') orgId: string) {
    return this.organizations.findById(orgId);
  }
}
