/**
 * Seeds demo traces for staging sales walkthroughs.
 * Usage: DATABASE_URL=... pnpm exec tsx scripts/seed-demo-traces.ts
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PrismaClient, Role, TraceStatus } from '@prisma/client';

const prisma = new PrismaClient();

const DEMO_ORG_SLUG = 'demo-acme';
const DEMO_PROJECT_SLUG = 'support-copilot';

async function main() {
  const fixture = JSON.parse(
    readFileSync(join(__dirname, '../apps/api/test/fixtures/ingest-trace.json'), 'utf8'),
  ) as {
    trace_id: string;
    workflow_name: string;
    actor: object;
    permission_snapshot: object;
    started_at: string;
    spans: Array<{
      span_id: string;
      name: string;
      events: Array<{
        event_id: string;
        type: string;
        occurred_at: string;
        span_id: string;
        payload?: object;
      }>;
    }>;
  };

  const organization = await prisma.organization.upsert({
    where: { slug: DEMO_ORG_SLUG },
    create: {
      name: 'Acme Demo Corp',
      slug: DEMO_ORG_SLUG,
      planTier: 'starter',
    },
    update: {},
  });

  const project = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: DEMO_PROJECT_SLUG,
      },
    },
    create: {
      organizationId: organization.id,
      name: 'Support Copilot',
      slug: DEMO_PROJECT_SLUG,
    },
    update: {},
  });

  const user = await prisma.user.upsert({
    where: { email: 'demo-admin@acme.test' },
    create: {
      externalId: 'clerk_demo_admin',
      email: 'demo-admin@acme.test',
      displayName: 'Demo Admin',
    },
    update: {},
  });

  await prisma.membership.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: Role.org_admin,
      acceptedAt: new Date(),
    },
    update: {},
  });

  const workflows = ['support_refund', 'password_reset', 'billing_inquiry'] as const;

  for (let i = 0; i < workflows.length; i += 1) {
    const workflow = workflows[i];
    const traceId = `tr_demo_${workflow}_${i + 1}`;
    const startedAt = new Date(Date.now() - i * 3600_000);

    await prisma.trace.upsert({
      where: {
        organizationId_externalTraceId: {
          organizationId: organization.id,
          externalTraceId: traceId,
        },
      },
      create: {
        organizationId: organization.id,
        projectId: project.id,
        externalTraceId: traceId,
        workflowName: workflow,
        status: TraceStatus.completed,
        startedAt,
        serverReceivedAt: startedAt,
        completedAt: new Date(startedAt.getTime() + 60_000),
        indexedAt: new Date(startedAt.getTime() + 120_000),
        sealedAt: new Date(startedAt.getTime() + 120_000),
        chainHash: 'a'.repeat(64),
        actor: fixture.actor,
        tags: { seeded: 'true', demo: 'staging' },
        permissionSnapshot: {
          create: {
            policyVersion: '2026.05.1',
            roles: ['support_agent'],
            scopes: ['tickets:read'],
            resourceIds: ['ord_demo'],
            deniedResources: [],
            capturedAt: startedAt,
          },
        },
        spans: {
          create: fixture.spans.map((span) => ({
            externalSpanId: span.span_id,
            name: span.name,
            events: {
              create: span.events.map((event, sequenceIndex) => ({
                organizationId: organization.id,
                externalEventId: `${event.event_id}_${i}`,
                type: event.type as never,
                occurredAt: new Date(event.occurred_at),
                sequenceIndex,
                contentHash: `${sequenceIndex}`.padStart(64, 'c'),
                chainHash: `${sequenceIndex}`.padStart(64, 'd'),
                payloadRef: null,
              })),
            },
          })),
        },
      },
      update: {
        workflowName: workflow,
        status: TraceStatus.completed,
        indexedAt: new Date(),
      },
    });
  }

  console.log('Seeded demo traces', {
    organizationId: organization.id,
    projectId: project.id,
    traceCount: workflows.length,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
