import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IngestTraceResponseDto } from './dto/ingest-trace-response.dto';

@Injectable()
export class IdempotencyService {
  constructor(private readonly prisma: PrismaService) {}

  async findCached(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<IngestTraceResponseDto | null> {
    const record = await this.prisma.ingestIdempotency.findUnique({
      where: {
        organizationId_idempotencyKey: { organizationId, idempotencyKey },
      },
    });
    if (!record) return null;
    return record.response as IngestTraceResponseDto;
  }

  async store(
    organizationId: string,
    idempotencyKey: string,
    traceId: string,
    response: IngestTraceResponseDto,
  ) {
    await this.prisma.ingestIdempotency.create({
      data: {
        organizationId,
        idempotencyKey,
        traceId,
        response,
      },
    });
  }
}
