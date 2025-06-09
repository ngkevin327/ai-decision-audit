import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { ReplayTimelineDto } from './dto/replay.dto';
import { ReplayService } from './replay.service';

@Controller('v1/traces')
@UseGuards(TenantGuard)
export class ReplayController {
  constructor(private readonly replay: ReplayService) {}

  @Get(':id/replay')
  async getReplay(@Param('id') id: string): Promise<ReplayTimelineDto> {
    return this.replay.getTimeline(id);
  }
}
