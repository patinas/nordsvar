// Local-mode user administration (mocked API): a tenant admin opens
// Administration -> Brugere and creates a user; an API conflict shows the
// server's Danish error. Also covers the accessibility of the new tab.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LOGIN_BODY = {
  tenant: '3f6b1c2e-0000-4000-8000-abcdefabcdef',
  username: 'admin',
  roles: ['tenant_admin'],
  token: 'mock-session-token',
  expires_at_unix: 1_800_000_000,
};

function mockLocalApi(page: import('@playwright/test').Page) {
  return page.route('**/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/v1/setup/status') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ needs_setup: false, auth_mode: 'local' }),
      });
    }
    if (url.pathname === '/v1/auth/login' && route.request().method() === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LOGIN_BODY),
      });
    }
    if (url.pathname === '/v1/sessions') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (url.pathname === '/v1/audit' || url.pathname === '/v1/kb/documents') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (url.pathname === '/v1/admin/users' && route.request().method() === 'POST') {
      const body = route.request().postDataJSON() as { username?: string };
      if (body.username === 'allerede-taget') {
        return route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: { code: 'conflict', message: 'brugeren findes allerede' },
          }),
        });
      }
      return route.fulfill({ status: 201, contentType: 'application/json', body: '{}' });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

async function signIn(page: import('@playwright/test').Page) {
  await mockLocalApi(page);
  await page.goto('/');
  await page.getByLabel('Brugernavn').fill('admin');
  await page.getByLabel('Adgangskode').fill('rigtig-adgangskode');
  await page.getByRole('button', { name: 'Log ind' }).click();
  await expect(page.getByRole('heading', { name: 'Supportsession' })).toBeVisible();
  await page.getByRole('button', { name: 'Administration' }).click();
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
}

test('tenant admin creates a local user from the Brugere tab', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Brugere' }).click();
  await expect(page.getByRole('heading', { name: 'Brugere' })).toBeVisible();

  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  await page.getByLabel('Brugernavn').fill('lise');
  await page.getByLabel(/Adgangskode/).fill('lang-adgangskode-123');
  await page.getByLabel('Rolle').selectOption('agent');
  await page.getByRole('button', { name: 'Opret bruger' }).click();
  await expect(page.getByText('Bruger lise oprettet')).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-users.png' });
});

test('a username conflict shows the API error without losing the form', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Brugere' }).click();
  await page.getByLabel('Brugernavn').fill('allerede-taget');
  await page.getByLabel(/Adgangskode/).fill('lang-adgangskode-123');
  await page.getByRole('button', { name: 'Opret bruger' }).click();
  await expect(page.getByRole('alert')).toContainText('brugeren findes allerede');
  await expect(page.getByLabel('Brugernavn')).toHaveValue('allerede-taget');
});

test('dev-mode deployments do not offer local user administration', async ({ page }) => {
  await page.route('**/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/v1/setup/status') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ needs_setup: false, auth_mode: 'dev' }),
      });
    }
    if (
      url.pathname === '/v1/sessions' ||
      url.pathname === '/v1/audit' ||
      url.pathname === '/v1/kb/documents'
    ) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
  await page.goto('/');
  await page.getByLabel('Bruger-ID').fill('dev-bruger');
  await page.getByLabel('Tenant-ID').fill('3f6b1c2e-0000-4000-8000-abcdefabcdef');
  await page.getByRole('button', { name: 'Fortsæt' }).click();
  await page.getByRole('button', { name: 'Administration' }).click();
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Brugere' })).toHaveCount(0);
});
