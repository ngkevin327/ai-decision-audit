async function bootstrap() {
  console.log('[worker] process started', {
    pid: process.pid,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  });
}

bootstrap().catch((err) => {
  console.error('[worker] fatal startup error', err);
  process.exit(1);
});
