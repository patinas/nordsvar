import { defineConfig } from '@playwright/test';

// Live browser E2E: the real built app (vite preview, proxying /v1 to the
// real API from the live stack), a real livekit-server, and the real AI
// worker. Owns the true join flow that the mocked session.spec.ts cannot
// prove: the browser actually connects to a LiveKit room that the AI is in.
export default defineConfig({
  testDir: './e2e/live',
  timeout: 60_000,
  retries: 0,
  globalSetup: './e2e/live/setup.ts',
  globalTeardown: './e2e/live/teardown.ts',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    launchOptions: {
      args: [
          '--use-fake-device-for-media-stream',
          '--use-fake-ui-for-media-stream',
          // getDisplayMedia in headless Chromium: auto-accept the picker
          // with the fake screen source from --use-fake-device-...
          '--auto-select-desktop-capture-source=Entire screen',
        ],
    },
  },
  webServer: {
    command: 'node e2e/live/serve.mjs',
    port: 4173,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
