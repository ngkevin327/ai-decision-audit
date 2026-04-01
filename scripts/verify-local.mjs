#!/usr/bin/env node
/**
 * Verifies local stack: dependency health, API health, optional ingest + query smoke.
 * Exit 0 = pass, 1 = fail.
 */
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const API_BASE = process.env.API_URL ?? 'http://localhost:3100';
const WEB_BASE = process.env.WEB_URL ?? 'http://localhost:5173';
const WEB_FALLBACK_PORTS = [5173, 5174, 5175, 5176];

const results = [];

function record(name, pass, detail) {
  results.push({ name, pass, detail });
  const icon = pass ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function fetchJson(url, init) {
  const res = await fetch(url, init);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }
  return { ok: res.ok, status: res.status, body };
}

function loadCredentials() {
  const credsPath = join(root, 'scripts', '.local-dev-credentials.json');
  if (existsSync(credsPath)) {
    return JSON.parse(readFileSync(credsPath, 'utf8'));
  }
  const envPath = join(root, '.env');
  if (!existsSync(envPath)) return null;
  const env = readFileSync(envPath, 'utf8');
  const apiKey = env.match(/^LOCAL_DEV_API_KEY=(.+)$/m)?.[1];
  const projectId = env.match(/^LOCAL_DEV_PROJECT_ID=(.+)$/m)?.[1];
  const organizationId = env.match(/^LOCAL_DEV_ORG_ID=(.+)$/m)?.[1];
  if (apiKey && projectId) {
    return { apiKey, projectId, organizationId };
  }
  return null;
}

async function main() {
  // Docker port probes via API health (implies deps if API up with all probes)
  try {
    const health = await fetchJson(`${API_BASE}/health`);
    const deps = health.body?.dependencies ?? {};
    const allUp =
      health.ok &&
      health.body?.status === 'ok' &&
      deps.database?.status === 'up' &&
      deps.storage?.status === 'up' &&
      deps.queue?.status === 'up';
    record(
      'API /health',
      allUp,
      allUp
        ? `db/storage/queue up`
        : health.ok
          ? `degraded: ${JSON.stringify(deps)}`
          : `HTTP ${health.status}`,
    );
  } catch (err) {
    record('API /health', false, err instanceof Error ? err.message : String(err));
  }

  try {
    const openapi = await fetch(`${API_BASE}/openapi.yaml`);
    record('API OpenAPI', openapi.ok, `HTTP ${openapi.status}`);
  } catch (err) {
    record('API OpenAPI', false, err instanceof Error ? err.message : String(err));
  }

  let webOk = false;
  let webDetail = '';
  const webCandidates = [
    WEB_BASE,
    ...WEB_FALLBACK_PORTS.map((p) => `http://localhost:${p}`),
  ].filter((v, i, a) => a.indexOf(v) === i);
  for (const base of webCandidates) {
    try {
      const web = await fetch(base);
      if (web.ok) {
        webOk = true;
        webDetail = `${base} HTTP ${web.status}`;
        break;
      }
      webDetail = `${base} HTTP ${web.status}`;
    } catch {
      /* try next port */
    }
  }
  record('Web UI', webOk, webDetail || 'no vite port responded');

  const creds = loadCredentials();
  if (!creds?.apiKey || creds.apiKey.startsWith('(')) {
    record('Ingest smoke', false, 'run: pnpm bootstrap:local');
    record('Query smoke', false, 'skipped (no API key)');
  } else {
    const fixturePath = join(root, 'apps', 'api', 'test', 'fixtures', 'ingest-trace.json');
    const fixture = JSON.parse(readFileSync(fixturePath, 'utf8'));
    const suffix = Date.now();
    const traceId = `tr_verify_${suffix}`;
    fixture.trace_id = traceId;
    for (const span of fixture.spans ?? []) {
      for (const event of span.events ?? []) {
        event.event_id = `${event.event_id}_${suffix}`;
      }
    }

    try {
      const ingest = await fetchJson(`${API_BASE}/v1/traces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': creds.apiKey,
          'X-Project-Id': creds.projectId,
        },
        body: JSON.stringify(fixture),
      });
      const ingestOk =
        ingest.ok && (ingest.status === 200 || ingest.status === 202) && ingest.body?.trace_id;
      record(
        'Ingest POST /v1/traces',
        ingestOk,
        ingestOk ? `trace_id=${ingest.body.trace_id}` : `HTTP ${ingest.status}`,
      );

      if (ingestOk) {
        await new Promise((r) => setTimeout(r, 2_000));
        const list = await fetchJson(
          `${API_BASE}/v1/traces?limit=5&workflow_name=${encodeURIComponent(fixture.workflow_name)}`,
          {
            headers: {
              'X-Api-Key': creds.apiKey,
              'X-Project-Id': creds.projectId,
            },
          },
        );
        const found = list.body?.traces?.some((t) => t.trace_id === traceId);
        record(
          'Query GET /v1/traces',
          list.ok && found,
          found ? 'trace visible in search' : `HTTP ${list.status}`,
        );
      } else {
        record('Query GET /v1/traces', false, 'skipped (ingest failed)');
      }
    } catch (err) {
      record('Ingest smoke', false, err instanceof Error ? err.message : String(err));
      record('Query smoke', false, 'skipped');
    }
  }

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length > 0) process.exit(1);
}

main();
