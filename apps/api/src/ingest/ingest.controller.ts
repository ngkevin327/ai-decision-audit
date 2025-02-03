import { Body, Controller, Headers, HttpCode, Post } from '@nestjs/common';
import { IngestTraceResponseDto } from './dto/ingest-trace-response.dto';
import { IngestService } from './ingest.service';

@Controller('v1/traces')
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
