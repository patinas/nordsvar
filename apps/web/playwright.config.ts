import { defineConfig } from '@playwright/test';

// Browser E2E: the real built app served by vite preview, with the API
// mocked at the fetch layer (page.route). Backend-covered E2E runs against
// a deployed stack; these tests own UI flow, accessibility, and responsive
// behaviour and must stay fast and hermetic for CI.
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:4173',
    screenshot: 'only-on-failure',
    // The app's service worker would handle fetches outside the page,
    // where page.route cannot mock them. Tests mock the API in-page.
    serviceWorkers: 'block',
    // The app picks its UI language from the browser; pin Danish so the
    // existing Danish assertions are stable. The i18n spec covers English.
    locale: 'da-DK',
  },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    port: 4173,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});

