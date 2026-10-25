import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const TENANT = '3f6b1c2e-0000-4000-8000-abcdefabcdef';

function mockApi(page: import('@playwright/test').Page) {
  return page.route('**/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/v1/sessions' && route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '11111111-2222-3333-4444-555555555555',
          room: 'nordsvar-test-room',
          status: 'active',
          created_by: 'andreas',
          created_at_unix: 1_700_000_000,
        }),
      });
    }
    if (url.pathname.endsWith('/join')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          token: 'mock-join-token',
          livekit_url: 'ws://localhost:7880',
          room: 'nordsvar-test-room',
          identity: 'andreas',
          expires_in_secs: 900,
        }),
      });
    }
    if (url.pathname === '/v1/sessions') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

async function signIn(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByLabel('Tenant-ID').fill(TENANT);
  await page.getByLabel('Bruger-ID').fill('andreas');
  await page.getByRole('button', { name: 'Fortsæt' }).click();
  await expect(page.getByRole('heading', { name: 'Supportsession' })).toBeVisible();
}

test('sign-in flow reaches the session view', async ({ page }) => {
  await signIn(page);
  await expect(page.getByRole('button', { name: 'Start session' })).toBeVisible();
  // The no-webcam invariant is user-visible copy.
  await expect(page.getByText('kamera bruges aldrig')).toBeVisible();
});

test('starting a session shows progress then fails closed when LiveKit is absent', async ({
  page,
}) => {
  await mockApi(page);
  await signIn(page);
  await page.getByRole('button', { name: 'Start session' }).click();
  // LiveKit connect against ws://localhost:7880 fails in this environment;
  // the UI must surface an error state, not hang.
  await expect(page.getByRole('alert')).toContainText('Noget gik galt', { timeout: 20_000 });
});

test('sign-in page has no accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('session view has no accessibility violations', async ({ page }) => {
  await mockApi(page);
  await signIn(page);
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});

test('visual snapshots: sign-in, session, mobile', async ({ page }, testInfo) => {
  await mockApi(page);
  await page.goto('/');
  await page.screenshot({ path: testInfo.outputPath('signin.png'), fullPage: true });
  await signIn(page);
  await page.screenshot({ path: testInfo.outputPath('session.png'), fullPage: true });
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  await page.screenshot({ path: testInfo.outputPath('mobile.png'), fullPage: true });
});

test('mobile viewport renders without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByRole('heading', { name: /Log ind/ })).toBeVisible();
});
