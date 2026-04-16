import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

const webDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(webDir, '../..');

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, repoRoot, '');
  const clerkPublishable =
    env.VITE_CLERK_PUBLISHABLE_KEY?.trim() || env.CLERK_PUBLISHABLE_KEY?.trim() || '';

  return {
    plugins: [react()],
    envDir: repoRoot,
    define: clerkPublishable
      ? { 'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(clerkPublishable) }
      : undefined,
    server: {
      port: 5173,
    },
  };
});
