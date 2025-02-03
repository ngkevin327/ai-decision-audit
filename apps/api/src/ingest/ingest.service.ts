import { Injectable, NotImplementedException } from '@nestjs/common';
import { IngestTraceResponseDto } from './dto/ingest-trace-response.dto';

@Injectable()
export class IngestService {
  async acceptTrace(_body: unknown, _idempotencyKey?: string): Promise<IngestTraceResponseDto> {
    throw new NotImplementedException('Ingest pipeline not yet wired');
  }
}
