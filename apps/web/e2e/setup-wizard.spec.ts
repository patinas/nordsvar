// First-run setup wizard (mocked API): a fresh local-auth deployment shows
// the wizard, creates the first admin, and lands signed in. The returning
// visit shows the plain login form with a clear error on bad credentials.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LOGIN_BODY = {
  tenant: '3f6b1c2e-0000-4000-8000-abcdefabcdef',
  username: 'admin',
  roles: ['tenant_admin'],
  token: 'mock-session-token',
  expires_at_unix: 1_800_000_000,
};

function mockSetupApi(
  page: import('@playwright/test').Page,
  needsSetup: boolean,
  seenAuth?: Record<string, string | undefined>,
) {
  return page.route('**/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (seenAuth) seenAuth[url.pathname] = route.request().headers()['authorization'];
    if (url.pathname === '/v1/setup/status') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ needs_setup: needsSetup, auth_mode: 'local' }),
      });
    }
    if (url.pathname === '/v1/setup/admin' && route.request().method() === 'POST') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(LOGIN_BODY),
      });
    }
    if (url.pathname === '/v1/auth/login' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { password?: string };
      if (body.password === 'rigtig-adgangskode') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(LOGIN_BODY),
        });
      }
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'unauthorized', message: 'unauthorized' } }),
      });
    }
    if (url.pathname === '/v1/sessions') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

test('fresh install shows the wizard and creating the admin signs in', async ({ page }) => {
  await mockSetupApi(page, true);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Velkommen til Nordsvar' })).toBeVisible();
  // Visual evidence of the wizard a beginner sees first.
  await page.screenshot({ path: 'test-results/setup-wizard.png' });

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByLabel('Brugernavn').fill('admin');
  await page.getByLabel('Adgangskode (mindst 12 tegn)').fill('rigtig-adgangskode');
  await page.getByLabel('Gentag adgangskode').fill('rigtig-adgangskode');
  await page.getByRole('button', { name: 'Opret administrator' }).click();
  await expect(page.getByRole('heading', { name: 'Supportsession' })).toBeVisible();
});

test('mismatched passwords stay on the wizard with a Danish error', async ({ page }) => {
  await mockSetupApi(page, true);
  await page.goto('/');
  await page.getByLabel('Brugernavn').fill('admin');
  await page.getByLabel('Adgangskode (mindst 12 tegn)').fill('rigtig-adgangskode');
  await page.getByLabel('Gentag adgangskode').fill('noget-andet-helt');
  await page.getByRole('button', { name: 'Opret administrator' }).click();
  await expect(page.getByRole('alert')).toHaveText('Adgangskoderne er ikke ens.');
  await expect(page.getByRole('heading', { name: 'Velkommen til Nordsvar' })).toBeVisible();
});

test('returning visit shows login; wrong password gets a clear error', async ({ page }) => {
  await mockSetupApi(page, false);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Log ind' })).toBeVisible();
  await page.getByLabel('Brugernavn').fill('admin');
  await page.getByLabel('Adgangskode').fill('forkert-kode-her');
  await page.getByRole('button', { name: 'Log ind' }).click();
  await expect(page.getByRole('alert')).toHaveText('Forkert brugernavn eller adgangskode.');

  await page.getByLabel('Adgangskode').fill('rigtig-adgangskode');
  await page.getByRole('button', { name: 'Log ind' }).click();
  await expect(page.getByRole('heading', { name: 'Supportsession' })).toBeVisible();
});

// Regression: the setup wizard signs the admin in with a local session
// token; every later admin call must carry it as a bearer token. The pages
// once dropped it, so a fresh local deployment 401'd on every admin view.
test('after setup the admin views call the API with the bearer token', async ({ page }) => {
  const seenAuth: Record<string, string | undefined> = {};
  await mockSetupApi(page, true, seenAuth);
  await page.goto('/');
  await page.getByLabel('Brugernavn').fill('admin');
  await page.getByLabel('Adgangskode (mindst 12 tegn)').fill('rigtig-adgangskode');
  await page.getByLabel('Gentag adgangskode').fill('rigtig-adgangskode');
  await page.getByRole('button', { name: 'Opret administrator' }).click();
  await expect(page.getByRole('heading', { name: 'Supportsession' })).toBeVisible();

  await page.getByRole('button', { name: 'Administration' }).click();
  await expect(page.getByRole('heading', { name: 'Sessioner' })).toBeVisible();
  expect(seenAuth['/v1/sessions']).toBe('Bearer mock-session-token');
  expect(seenAuth['/v1/audit']).toBe('Bearer mock-session-token');
  expect(seenAuth['/v1/kb/documents']).toBe('Bearer mock-session-token');
});
