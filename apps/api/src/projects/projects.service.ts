import { Injectable, NotFoundException } from '@nestjs/common';
import { EnvironmentName } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async listByOrganization(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      include: { environments: true },
      orderBy: { name: 'asc' },
    });
  }

  async findById(organizationId: string, projectId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
      include: { environments: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async create(organizationId: string, dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: {
        organizationId,
        name: dto.name,
        slug: dto.slug,
        environments: {
          create: [{ name: EnvironmentName.staging }, { name: EnvironmentName.production }],
        },
      },
      include: { environments: true },
    });
  }

  async listEnvironments(organizationId: string, projectId: string) {
    const project = await this.findById(organizationId, projectId);
    return project.environments;
  }
}
