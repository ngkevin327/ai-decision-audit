import { Module } from '@nestjs/common';
import { OnboardingController } from './onboarding.controller';
import { OnboardingService } from './onboarding.service';
import { OrganizationsController } from './organizations.controller';
import { PublicOrganizationsController } from './public-organizations.controller';
import { OrganizationsService } from './organizations.service';

@Module({
  controllers: [OrganizationsController, PublicOrganizationsController, OnboardingController],
  providers: [OrganizationsService, OnboardingService],
  exports: [OrganizationsService, OnboardingService],
})
export class OrganizationsModule {}
