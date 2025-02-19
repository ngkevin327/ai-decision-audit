import { Body, Controller, Headers, HttpCode, Post, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../common/guards/tenant.guard';
import { IngestTraceResponseDto } from './dto/ingest-trace-response.dto';
import { IngestAuthGuard } from './guards/ingest-auth.guard';
import { IngestService } from './ingest.service';

@Controller('v1/traces')
@UseGuards(TenantGuard, IngestAuthGuard)
export class IngestController {
  constructor(private readonly ingest: IngestService) {}

  @Post()
  @HttpCode(202)
  async ingest(
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey?: string,
  ): Promise<IngestTraceResponseDto> {
    return this.ingest.acceptTrace(body, idempotencyKey);
  }
}
