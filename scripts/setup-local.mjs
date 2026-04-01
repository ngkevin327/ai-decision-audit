#!/usr/bin/env node
/**
 * Deterministic first-run local setup:
 * - ensure .env from .env.example
 * - start docker dependencies and wait for ports
 * - pnpm install, prisma generate + migrate
 */
import { copyFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function run(command, args, opts = {}) {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32',
    ...opts,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function syncEnvToApp(appDir) {
  const envPath = join(root, '.env');
  const target = join(root, appDir, '.env');
  if (existsSync(envPath)) {
    copyFileSync(envPath, target);
  }
}

function ensureEnv() {
  const envPath = join(root, '.env');
  const examplePath = join(root, '.env.example');
  if (!existsSync(envPath)) {
    copyFileSync(examplePath, envPath);
    console.log('Created .env from .env.example');
  } else {
    console.log('.env already exists — leaving unchanged');
  }
  syncEnvToApp('apps/api');
}

ensureEnv();

run('docker', ['compose', 'up', '-d']);
run('node', ['scripts/wait-for-deps.mjs']);
run('pnpm', ['install', '--frozen-lockfile']);
run('pnpm', ['db:generate']);
run('pnpm', ['db:migrate']);
run('pnpm', ['bootstrap:local']);

console.log('\nLocal setup complete. Next: pnpm dev (then pnpm verify:local in another terminal)');

