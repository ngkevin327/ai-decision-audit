import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TraceStatus } from '@prisma/client';
import { TenantGuard } from '../common/guards/tenant.guard';
import type { TraceSearchQueryDto } from './dto/trace-search-query.dto';
import type { TraceListResponseDto } from './dto/trace-list-item.dto';
import { TracesQueryService } from './traces-query.service';

@Controller('v1/traces')
@UseGuards(TenantGuard)
export class TracesQueryController {
  constructor(private readonly tracesQuery: TracesQueryService) {}

  @Get()
  async search(
    @Query('project_id') projectId?: string,
    @Query('status') status?: TraceStatus,
    @Query('workflow_name') workflowName?: string,
    @Query('actor_id') actorId?: string,
    @Query('model') model?: string,
    @Query('tag_key') tagKey?: string,
    @Query('tag_value') tagValue?: string,
    @Query('q') q?: string,
    @Query('started_after') startedAfter?: string,
    @Query('started_before') startedBefore?: string,
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ): Promise<TraceListResponseDto> {
    const query: TraceSearchQueryDto = {
      projectId,
      status,
      workflowName,
      actorId,
      model,
      tagKey,
      tagValue,
      q,
      startedAfter,
      startedBefore,
      limit: limit ? Number(limit) : undefined,
      cursor,
    };
    return this.tracesQuery.search(query);
  }
}
