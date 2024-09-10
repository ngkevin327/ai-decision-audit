import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class MembershipsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(organizationId: string) {
    return this.prisma.membership.findMany({
      where: { organizationId },
      include: { user: true },
      orderBy: { createdAt: 'asc' },
    });
  }

  async invite(organizationId: string, dto: InviteMemberDto) {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      const membership = await this.prisma.membership.findUnique({
        where: {
          organizationId_userId: { organizationId, userId: existing.id },
        },
      });
      if (membership) {
        throw new ConflictException('User is already a member');
      }
    }

    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          email: dto.email,
          externalId: `pending_${dto.email}`,
          displayName: dto.displayName,
        },
      }));

    return this.prisma.membership.create({
      data: {
        organizationId,
        userId: user.id,
        role: dto.role,
        invitedAt: new Date(),
      },
      include: { user: true },
    });
  }

  async updateRole(organizationId: string, membershipId: string, dto: UpdateRoleDto) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role: dto.role },
      include: { user: true },
    });
  }

  async acceptInvite(organizationId: string, membershipId: string) {
    const membership = await this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId },
    });
    if (!membership) {
      throw new NotFoundException('Membership not found');
    }
    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { acceptedAt: new Date() },
      include: { user: true },
    });
  }
}
