import { Injectable } from '@nestjs/common';
import { TraceStatus } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

@Injectable()
export class TraceSealService {
  constructor(private readonly prisma: PrismaService) {}

  async sealIfTerminal(
    traceId: string,
    status: TraceStatus,
    finalChainHash: string,
  ): Promise<void> {
    if (status === TraceStatus.in_progress) {
      return;
    }

    const sealedAt = new Date();
    await this.prisma.trace.update({
      where: { id: traceId },
      data: {
        status,
        chainHash: finalChainHash,
        sealedAt,
        completedAt: status === TraceStatus.completed ? sealedAt : undefined,
      },
    });
  }
}
