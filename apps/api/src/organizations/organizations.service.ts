import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const org = await this.prisma.organization.findUnique({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async findBySlug(slug: string) {
    const org = await this.prisma.organization.findUnique({ where: { slug } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        slug: dto.slug,
      },
    });
  }

  async listForUser(userId: string) {
    return this.prisma.organization.findMany({
      where: {
        memberships: { some: { userId, acceptedAt: { not: null } } },
      },
      orderBy: { name: 'asc' },
    });
  }
}
