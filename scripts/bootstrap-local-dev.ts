/**
 * Creates local org/project/environment + ingest API key for MVP verification.
 * Writes scripts/.local-dev-credentials.json (gitignored) and appends to .env if missing.
 */
import { createHash, randomBytes } from 'node:crypto';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import * as bcrypt from 'bcrypt';
import { EnvironmentName, PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();
const root = join(__dirname, '..');
const credsPath = join(root, 'scripts', '.local-dev-credentials.json');

const LOCAL_ORG_SLUG = 'local-dev';
const LOCAL_PROJECT_SLUG = 'default';

function generateApiKey(): string {
  const suffix = randomBytes(24).toString('base64url');
  return `at_live_${suffix}`;
}

async function main() {
  const organization = await prisma.organization.upsert({
    where: { slug: LOCAL_ORG_SLUG },
    create: {
      name: 'Local Dev Org',
      slug: LOCAL_ORG_SLUG,
      planTier: 'starter',
    },
    update: {},
  });

  const project = await prisma.project.upsert({
    where: {
      organizationId_slug: {
        organizationId: organization.id,
        slug: LOCAL_PROJECT_SLUG,
      },
    },
    create: {
      organizationId: organization.id,
      name: 'Default Project',
      slug: LOCAL_PROJECT_SLUG,
    },
    update: {},
  });

  const environment = await prisma.environment.upsert({
    where: {
      projectId_name: {
        projectId: project.id,
        name: EnvironmentName.staging,
      },
    },
    create: {
      projectId: project.id,
      name: EnvironmentName.staging,
    },
    update: {},
  });

  const user = await prisma.user.upsert({
    where: { email: 'local-dev@audit-trail.test' },
    create: {
      externalId: 'local_dev_user',
      email: 'local-dev@audit-trail.test',
      displayName: 'Local Dev',
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

  const existing = await prisma.apiKey.findFirst({
    where: {
      organizationId: organization.id,
      projectId: project.id,
      name: 'local-dev-ingest',
      revokedAt: null,
    },
  });

  let plaintextKey: string;
  if (existing) {
    const creds = existsSync(credsPath)
      ? (JSON.parse(readFileSync(credsPath, 'utf8')) as { apiKey?: string })
      : {};
    if (creds.apiKey) {
      plaintextKey = creds.apiKey;
      console.log('Reusing API key from scripts/.local-dev-credentials.json');
    } else {
      console.warn(
        'API key record exists but plaintext not in credentials file. Revoke in DB and re-run bootstrap.',
      );
      plaintextKey = '(revoke existing key and re-run bootstrap)';
    }
  } else {
    plaintextKey = generateApiKey();
    const keyPrefix = plaintextKey.slice(0, 16);
    const keyHash = await bcrypt.hash(plaintextKey, 10);
    await prisma.apiKey.create({
      data: {
        organizationId: organization.id,
        projectId: project.id,
        environmentId: environment.id,
        name: 'local-dev-ingest',
        keyPrefix,
        keyHash,
        scopes: ['trace:ingest', 'trace:read', 'export:create'],
        createdById: user.id,
      },
    });
  }

  const payload = {
    organizationId: organization.id,
    organizationSlug: LOCAL_ORG_SLUG,
    projectId: project.id,
    projectSlug: LOCAL_PROJECT_SLUG,
    environmentId: environment.id,
    userId: user.id,
    apiKey: plaintextKey,
    generatedAt: new Date().toISOString(),
  };

  writeFileSync(credsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  const envPath = join(root, '.env');
  const envLines = [
    '',
    '# --- local bootstrap (scripts/bootstrap-local-dev.ts) ---',
    `LOCAL_DEV_ORG_ID=${organization.id}`,
    `LOCAL_DEV_PROJECT_ID=${project.id}`,
    `LOCAL_DEV_API_KEY=${plaintextKey}`,
    `EXPORT_SIGNING_SECRET=dev-export-signing-secret`,
  ];

  const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  for (const line of envLines) {
    const key = line.split('=')[0]?.replace(/^#.*$/, '').trim();
    if (!key || line.startsWith('#')) continue;
    if (envContent.includes(`${key}=`)) continue;
    appendFileSync(envPath, `${line}\n`, 'utf8');
  }

  const webEnvPath = join(root, 'apps', 'web', '.env.local');
  const rootEnv = existsSync(envPath) ? readFileSync(envPath, 'utf8') : '';
  const clerkPublishable = rootEnv.match(/^CLERK_PUBLISHABLE_KEY=(.+)$/m)?.[1]?.trim();
  const webLines = [
    'VITE_API_BASE_URL=http://localhost:3100',
    `VITE_DEFAULT_ORG_ID=${organization.id}`,
    'VITE_DEV_USER_ID=local_dev_user',
    ...(clerkPublishable ? [`VITE_CLERK_PUBLISHABLE_KEY=${clerkPublishable}`] : []),
  ];
  const webContent = existsSync(webEnvPath) ? readFileSync(webEnvPath, 'utf8') : '';
  const webToWrite = webLines.filter((l) => !webContent.includes(l.split('=')[0] + '='));
  if (webToWrite.length > 0) {
    appendFileSync(webEnvPath, `${webToWrite.join('\n')}\n`, 'utf8');
  }

  console.log('Local dev bootstrap complete:', {
    organizationId: organization.id,
    projectId: project.id,
    credentialsFile: credsPath,
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
