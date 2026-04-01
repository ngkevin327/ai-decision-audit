/**
 * Preload hook: `node -r ../../scripts/load-root-env.cjs ...`
 * Loads monorepo root `.env` into process.env before app bootstrap.
 */
const { existsSync, readFileSync } = require('node:fs');
const { join } = require('node:path');

const envPath = join(__dirname, '..', '.env');
if (!existsSync(envPath)) {
  return;
}

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  const key = trimmed.slice(0, eq).trim();
  const value = trimmed.slice(eq + 1).trim();
  if (!(key in process.env)) {
    process.env[key] = value;
  }
}
