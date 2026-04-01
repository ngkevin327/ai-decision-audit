#!/usr/bin/env node
/**
 * Waits until Postgres, Redis, and MinIO accept connections (local docker compose).
 */
import net from 'node:net';

const targets = [
  { name: 'postgres', host: '127.0.0.1', port: Number(process.env.POSTGRES_PORT ?? 15432) },
  { name: 'redis', host: '127.0.0.1', port: Number(process.env.REDIS_PORT ?? 16379) },
  { name: 'minio', host: '127.0.0.1', port: Number(process.env.MINIO_PORT ?? 19000) },
];

const timeoutMs = Number(process.env.WAIT_TIMEOUT_MS ?? 120_000);
const intervalMs = 1_500;

function probe(host, port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port }, () => {
      socket.end();
      resolve(true);
    });
    socket.setTimeout(2_000);
    socket.on('error', () => resolve(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function waitForAll() {
  const started = Date.now();
  const pending = new Set(targets.map((t) => t.name));

  while (pending.size > 0) {
    if (Date.now() - started > timeoutMs) {
      throw new Error(
        `Timed out after ${timeoutMs}ms waiting for: ${[...pending].join(', ')}`,
      );
    }

    for (const target of targets) {
      if (!pending.has(target.name)) continue;
      const ok = await probe(target.host, target.port);
      if (ok) {
        pending.delete(target.name);
        console.log(`[wait-for-deps] ${target.name} is up`);
      }
    }

    if (pending.size > 0) {
      await new Promise((r) => setTimeout(r, intervalMs));
    }
  }
}

waitForAll().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
