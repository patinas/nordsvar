// KB document lifecycle in the admin portal (mocked API): the Vidensbase
// tab lists uploaded documents, and deleting one is a two-tap confirmed
// action that removes the row. Danish-first, axe-checked.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LOGIN_BODY = {
  tenant: '3f6b1c2e-0000-4000-8000-abcdefabcdef',
  username: 'admin',
  roles: ['tenant_admin'],
  token: 'mock-session-token',
  expires_at_unix: 1_800_000_000,
};

const DOC = {
  id: 'doc-1',
  name: 'feriepolitik.md',
  format: 'markdown',
  chunks_indexed: 4,
  ingested_by: 'admin',
  ingested_at_unix: 1_757_000_000,
};

function mockApi(page: import('@playwright/test').Page) {
  let deleted = false;
  return page.route('**/v1/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/v1/setup/status') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ needs_setup: false, auth_mode: 'local' }),
      });
    }
    if (url.pathname === '/v1/auth/login') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(LOGIN_BODY),
      });
    }
    if (url.pathname === '/v1/sessions' || url.pathname === '/v1/audit') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (url.pathname === '/v1/kb/documents' && route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(deleted ? [] : [DOC]),
      });
    }
    if (url.pathname === '/v1/kb/documents/doc-1' && route.request().method() === 'DELETE') {
      deleted = true;
      return route.fulfill({ status: 204, body: '' });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

test('Vidensbase lists documents and delete is two-tap confirmed', async ({ page }) => {
  await mockApi(page);
  await page.goto('/');
  await page.getByLabel('Brugernavn').fill('admin');
  await page.getByLabel('Adgangskode').fill('rigtig-adgangskode');
  await page.getByRole('button', { name: 'Log ind' }).click();
  await page.getByRole('button', { name: 'Administration' }).click();
  await page.getByRole('button', { name: 'Vidensbase' }).click();

  await expect(page.getByRole('cell', { name: 'feriepolitik.md' })).toBeVisible();
  const accessibility = await new AxeBuilder({ page }).analyze();
  expect(accessibility.violations).toEqual([]);

  const del = page.getByRole('button', { name: 'Slet' });
  await del.click(); // first tap arms
  const confirm = page.getByRole('button', { name: 'Bekræft sletning' });
  await expect(confirm).toBeVisible();
  await page.screenshot({ path: 'test-results/admin-kb-confirm.png' });
  await confirm.click(); // second tap executes
  await expect(page.getByRole('cell', { name: 'feriepolitik.md' })).toHaveCount(0);
  await expect(page.getByText('Ingen dokumenter endnu')).toBeVisible();
});
