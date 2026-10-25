// Language chooser: visible on every screen, switches the whole UI with no
// mixed-language state, and persists across reloads. The browser locale
// also picks the initial language for first-time visitors.
import { test, expect } from '@playwright/test';

test.describe('language chooser', () => {
  test.use({ locale: 'en-US' });

  test('English browser gets English UI by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in (development mode)' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  });

  test('switching to Danish re-renders everything and persists', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Sign in (development mode)' })).toBeVisible();
    await page.getByLabel('Language').selectOption('da');
    await expect(page.getByRole('heading', { name: 'Log ind (udviklingstilstand)' })).toBeVisible();
    await expect(page.locator('html')).toHaveAttribute('lang', 'da');
    // Persistence: reload keeps the choice.
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Log ind (udviklingstilstand)' })).toBeVisible();
    // And back to English for the next test.
    await page.getByLabel('Sprog').selectOption('en');
    await expect(page.getByRole('heading', { name: 'Sign in (development mode)' })).toBeVisible();
  });
});

test.describe('phone support session', () => {
  test.use({ locale: 'da-DK', viewport: { width: 360, height: 740 } });

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
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
    });
  }

  test('start button is full-width usable on a 360px phone viewport', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    await page.getByLabel('Tenant-ID').fill(TENANT);
    await page.getByLabel('Bruger-ID').fill('andreas');
    await page.getByRole('button', { name: 'Fortsæt' }).click();
    const start = page.getByRole('button', { name: 'Start session' });
    await expect(start).toBeVisible();
    const box = await start.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    expect(box!.height).toBeGreaterThanOrEqual(44);
  });
});
