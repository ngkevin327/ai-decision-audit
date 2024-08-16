import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: ['log', 'error', 'warn'],
  });
  await app.init();
  console.log('[worker] bootstrap complete', { pid: process.pid });
}

bootstrap().catch((err) => {
  console.error('[worker] fatal startup error', err);
  process.exit(1);
});
