import { Body, Controller, Post } from '@nestjs/common';
import { OnboardingDto } from './dto/onboarding.dto';
import { OnboardingService } from './onboarding.service';

@Controller('public/onboarding')
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Post()
  signup(@Body() dto: OnboardingDto) {
    return this.onboarding.completeSignup(dto);
  }
}
