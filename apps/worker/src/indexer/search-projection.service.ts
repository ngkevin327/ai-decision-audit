import { Injectable } from '@nestjs/common';
import { EventType, Prisma, Trace } from '@prisma/client';
import { PrismaService } from '@api/prisma/prisma.service';

interface TraceWithEvents extends Trace {
  spans: Array<{
    events: Array<{ type: EventType }>;
  }>;
}

@Injectable()
export class SearchProjectionService {
  constructor(private readonly prisma: PrismaService) {}

  async update(trace: TraceWithEvents): Promise<void> {
    const indexedAt = new Date();
    const primaryModel = this.resolvePrimaryModel(trace);
    const searchTags = this.buildSearchTags(trace);

    await this.prisma.trace.update({
      where: { id: trace.id },
      data: {
        indexedAt,
        primaryModel,
        tags: searchTags,
      },
    });
  }

  private resolvePrimaryModel(trace: TraceWithEvents): string | null {
    const tags = trace.tags as Record<string, unknown> | null;
    if (typeof tags?.model === 'string') {
      return tags.model;
    }

    const hasCompletion = trace.spans.some((span) =>
      span.events.some((event) => event.type === EventType.completion),
    );
    return hasCompletion ? 'unknown' : null;
  }

  private buildSearchTags(trace: TraceWithEvents): Prisma.InputJsonValue | undefined {
    const existing = (trace.tags as Record<string, unknown> | null) ?? {};
    const actor = trace.actor as Record<string, unknown>;
    const actorId = typeof actor.actor_id === 'string' ? actor.actor_id : undefined;

    return {
      ...existing,
      _search: {
        workflow_name: trace.workflowName,
        actor_id: actorId,
        primary_model: this.resolvePrimaryModel(trace),
      },
    } as Prisma.InputJsonValue;
  }
}
