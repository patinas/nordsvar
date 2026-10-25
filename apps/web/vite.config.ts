import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Dev server proxies to the local dev API; `vite preview` (used by the
// live browser E2E) proxies to the fixed live-test API port that
// e2e/live/stack.ts binds.
export default defineConfig({
  plugins: [svelte()],
  server: {
    proxy: { '/v1': 'http://localhost:8080', '/healthz': 'http://localhost:8080' },
  },
  preview: {
    proxy: { '/v1': 'http://127.0.0.1:38111', '/healthz': 'http://127.0.0.1:38111' },
  },
  test: {
    exclude: ['e2e/**', 'node_modules/**'],
    environment: 'node',
  },
});
