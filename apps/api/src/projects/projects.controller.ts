import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/permissions.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { CreateProjectDto } from './dto/create-project.dto';
import { ProjectsService } from './projects.service';

@Controller('organizations/:orgId/projects')
@UseGuards(TenantGuard, RolesGuard)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  list(@Param('orgId') orgId: string) {
    return this.projects.listByOrganization(orgId);
  }

  @Post()
  @Roles('org_admin')
  create(@Param('orgId') orgId: string, @Body() dto: CreateProjectDto) {
    return this.projects.create(orgId, dto);
  }

  @Get(':projectId')
  findOne(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.projects.findById(orgId, projectId);
  }

  @Get(':projectId/environments')
  listEnvironments(@Param('orgId') orgId: string, @Param('projectId') projectId: string) {
    return this.projects.listEnvironments(orgId, projectId);
  }
}
