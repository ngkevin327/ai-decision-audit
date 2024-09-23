import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Role } from '@prisma/client';
import { ProjectsService } from '../../src/projects/projects.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { TenantContextService } from '../../src/common/tenant/tenant-context.service';

describe('Tenant isolation', () => {
  let projects: ProjectsService;
  let prisma: { project: { findFirst: jest.Mock } };

  beforeEach(async () => {
    prisma = {
      project: { findFirst: jest.fn() },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ProjectsService,
        TenantContextService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    projects = moduleRef.get(ProjectsService);
  });

  it('returns 404 when project belongs to another organization', async () => {
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(projects.findById('org-a', 'project-b')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('scopes list queries to the requested organization', async () => {
    prisma.project.findFirst.mockReset();
    const listSpy = jest.spyOn(projects, 'listByOrganization').mockResolvedValue([] as never);

    await projects.listByOrganization('org-a');
    expect(listSpy).toHaveBeenCalledWith('org-a');
  });
});

describe('TenantContextService', () => {
  it('isolates context between concurrent scopes', () => {
    const service = new TenantContextService();
    let orgB: string | undefined;

    service.run(
      {
        authMethod: 'jwt',
        organizationId: 'org-a',
        userId: 'user-1',
        role: Role.org_admin,
        scopes: ['admin'],
      },
      () => {
        service.run(
          {
            authMethod: 'jwt',
            organizationId: 'org-b',
            userId: 'user-2',
            role: Role.viewer,
            scopes: ['trace:read'],
          },
          () => {
            orgB = service.get()?.organizationId;
          },
        );
        expect(service.get()?.organizationId).toBe('org-a');
      },
    );

    expect(orgB).toBe('org-b');
    expect(service.get()).toBeUndefined();
  });
});
