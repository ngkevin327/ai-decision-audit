import { Injectable } from '@nestjs/common';
import { EnvironmentName, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

export interface OnboardingInput extends CreateOrganizationDto {
  ownerExternalId: string;
  ownerEmail: string;
  ownerDisplayName?: string;
  defaultProjectName?: string;
  defaultProjectSlug?: string;
}

@Injectable()
export class OnboardingService {
  constructor(private readonly prisma: PrismaService) {}

  async completeSignup(input: OnboardingInput) {
    const projectName = input.defaultProjectName ?? 'Default';
    const projectSlug = input.defaultProjectSlug ?? 'default';

    return this.prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: { name: input.name, slug: input.slug },
      });

      const user = await tx.user.upsert({
        where: { externalId: input.ownerExternalId },
        update: {
          email: input.ownerEmail,
          displayName: input.ownerDisplayName,
        },
        create: {
          externalId: input.ownerExternalId,
          email: input.ownerEmail,
          displayName: input.ownerDisplayName,
        },
      });

      await tx.membership.create({
        data: {
          organizationId: org.id,
          userId: user.id,
          role: Role.org_admin,
          acceptedAt: new Date(),
        },
      });

      const project = await tx.project.create({
        data: {
          organizationId: org.id,
          name: projectName,
          slug: projectSlug,
          environments: {
            create: [{ name: EnvironmentName.staging }, { name: EnvironmentName.production }],
          },
        },
        include: { environments: true },
      });

      return { organization: org, user, project };
    });
  }
}
