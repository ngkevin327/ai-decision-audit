import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/permissions.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { TenantGuard } from '../common/guards/tenant.guard';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { MembershipsService } from './memberships.service';

@Controller('organizations/:orgId/members')
@UseGuards(TenantGuard, RolesGuard)
export class MembershipsController {
  constructor(private readonly memberships: MembershipsService) {}

  @Get()
  @Roles('org_admin', 'auditor')
  list(@Param('orgId') orgId: string) {
    return this.memberships.list(orgId);
  }

  @Post('invite')
  @Roles('org_admin')
  invite(@Param('orgId') orgId: string, @Body() dto: InviteMemberDto) {
    return this.memberships.invite(orgId, dto);
  }

  @Patch(':membershipId/role')
  @Roles('org_admin')
  updateRole(
    @Param('orgId') orgId: string,
    @Param('membershipId') membershipId: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.memberships.updateRole(orgId, membershipId, dto);
  }

  @Post(':membershipId/accept')
  accept(@Param('orgId') orgId: string, @Param('membershipId') membershipId: string) {
    return this.memberships.acceptInvite(orgId, membershipId);
  }
}
