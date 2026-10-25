// Indstillinger tab (mocked API): a tenant admin opens Administration ->
// Indstillinger, edits the AI overrides, saves, and tests the provider
// connection. The provider key is write-only: the mock asserts the keep /
// clear / replace semantics on the wire.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const LOGIN_BODY = {
  tenant: '3f6b1c2e-0000-4000-8000-abcdefabcdef',
  username: 'admin',
  roles: ['tenant_admin'],
  token: 'mock-session-token',
  expires_at_unix: 1_800_000_000,
};

const freshSettings = () => ({
  llm_model: 'llama3.1:8b',
  embed_model: null as string | null,
  stt_language: 'da',
  llm_base_url: 'https://llm.eksempel.dk',
  llm_api_key_set: true,
});
let settingsState = freshSettings();

test.beforeEach(() => {
  settingsState = freshSettings();
});

function mockApi(page: import('@playwright/test').Page) {
  return page.route('**/v1/**', async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (url.pathname === '/v1/setup/status') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ needs_setup: false, auth_mode: 'local' }),
      });
    }
    if (url.pathname === '/v1/auth/login' && method === 'POST') {
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
    if (url.pathname === '/v1/settings' && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(settingsState),
      });
    }
    if (url.pathname === '/v1/settings' && method === 'PUT') {
      const body = route.request().postDataJSON() as Record<string, string | undefined>;
      settingsState = {
        llm_model: body.llm_model || null,
        embed_model: body.embed_model || null,
        stt_language: body.stt_language || null,
        llm_base_url: body.llm_base_url || null,
        llm_api_key_set:
          body.llm_api_key === undefined ? settingsState.llm_api_key_set : body.llm_api_key !== '',
      };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(settingsState),
      });
    }
    if (url.pathname === '/v1/settings/llm/test' && method === 'POST') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, detail: 'forbundet (HTTP 200)' }),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

async function signIn(page: import('@playwright/test').Page) {
  await mockApi(page);
  await page.goto('/');
  await page.getByLabel('Brugernavn').fill('admin');
  await page.getByLabel('Adgangskode').fill('rigtig-adgangskode');
  await page.getByRole('button', { name: 'Log ind' }).click();
  await page.getByRole('button', { name: 'Administration' }).click();
  await expect(page.getByRole('heading', { name: 'Administration' })).toBeVisible();
}


async function openAdvanced(page: import('@playwright/test').Page) {
  await page.getByText('Avancerede indstillinger (modelnavne og tekniske detaljer)').click();
}

test('tenant admin edits and saves settings, then tests the connection', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Indstillinger' }).click();
  await expect(page.getByRole('heading', { name: 'Indstillinger' })).toBeVisible();

  // Draft is populated from the stored values (model fields live behind
  // the advanced disclosure).
  await openAdvanced(page);
  await expect(page.getByLabel('Svarmodel (tekst-AI)')).toHaveValue('llama3.1:8b');
  await expect(page.getByLabel('Talesprog (to bogstaver, fx da)')).toHaveValue('da');
  await expect(page.getByLabel('Endpoint-URL (OpenAI-kompatibel, https)')).toHaveValue(
    'https://llm.eksempel.dk',
  );
  // The stored key is reported as set, never echoed.
  await expect(page.getByLabel('Nøgle fra udbyderen')).toHaveValue('');
  await expect(page.getByText('Ryd den gemte nøgle')).toBeVisible();

  await page.screenshot({ path: '/tmp/admin-settings-loaded.png', fullPage: true });

  // Edit the model and save; leave the key field empty = keep the stored key.
  await page.getByLabel('Svarmodel (tekst-AI)').fill('mistral:latest');
  await page.getByRole('button', { name: 'Gem indstillinger' }).click();
  await expect(page.getByText('Indstillinger gemt')).toBeVisible();
  expect(settingsState.llm_model).toBe('mistral:latest');
  expect(settingsState.llm_api_key_set).toBe(true);

  // Test connection shows the server verdict.
  await page.getByRole('button', { name: 'Test forbindelse' }).click();
  await expect(page.getByText('forbundet (HTTP 200)')).toBeVisible();

  await page.screenshot({ path: '/tmp/admin-settings-saved.png', fullPage: true });
});

test('clearing the stored key sends an empty key and hides the clear option', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Indstillinger' }).click();
  await openAdvanced(page);
  await expect(page.getByLabel('Svarmodel (tekst-AI)')).toHaveValue('llama3.1:8b');

  await page.getByLabel('Ryd den gemte nøgle').check();
  await page.getByRole('button', { name: 'Gem indstillinger' }).click();
  await expect(page.getByText('Indstillinger gemt')).toBeVisible();
  expect(settingsState.llm_api_key_set).toBe(false);
  // After reload of values, the clear checkbox is gone (no key stored).
  await expect(page.getByText('Ryd den gemte nøgle')).not.toBeVisible();
});

test('settings tab is accessible', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Indstillinger' }).click();
  await openAdvanced(page);
  await expect(page.getByLabel('Svarmodel (tekst-AI)')).toHaveValue('llama3.1:8b');
  const results = await new AxeBuilder({ page }).analyze();
  expect(results.violations).toEqual([]);
});


test('provider dropdown fills preset defaults and keeps the stored key', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Indstillinger' }).click();

  // The saved https://llm.eksempel.dk maps to Custom with the URL preserved.
  await expect(page.getByLabel('Hvor skal svarene laves?')).toHaveValue('custom');
  await openAdvanced(page);
  await expect(page.getByLabel('Endpoint-URL (OpenAI-kompatibel, https)')).toHaveValue(
    'https://llm.eksempel.dk',
  );

  // Picking Groq fills the base URL and hides the URL field; the saved
  // custom model (llama3.1:8b) is not clobbered by the preset default.
  await page.getByLabel('Hvor skal svarene laves?').selectOption('groq');
  await expect(page.getByText('Svarene laves hos: https://api.groq.com/openai/v1')).toBeVisible();
  await expect(page.getByLabel('Svarmodel (tekst-AI)')).toHaveValue('llama3.1:8b');

  // A model the admin typed survives a provider switch.
  await page.getByLabel('Svarmodel (tekst-AI)').fill('min-egen-model');
  await page.getByLabel('Hvor skal svarene laves?').selectOption('openai');
  await expect(page.getByLabel('Svarmodel (tekst-AI)')).toHaveValue('min-egen-model');

  // An empty model field picks up the preset default.
  await page.getByLabel('Svarmodel (tekst-AI)').fill('');
  await page.getByLabel('Hvor skal svarene laves?').selectOption('groq');
  await expect(page.getByLabel('Svarmodel (tekst-AI)')).toHaveValue('llama-3.3-70b-versatile');

  // Switching to Custom keeps the preset URL editable instead of wiping it.
  await page.getByLabel('Hvor skal svarene laves?').selectOption('custom');
  await expect(page.getByLabel('Endpoint-URL (OpenAI-kompatibel, https)')).toHaveValue(
    'https://api.groq.com/openai/v1',
  );
  await page.getByLabel('Hvor skal svarene laves?').selectOption('groq');

  // Save: the wire carries the preset URL; the untouched key field keeps the
  // stored key.
  await page.getByRole('button', { name: 'Gem indstillinger' }).click();
  await expect(page.getByText('Indstillinger gemt')).toBeVisible();
  expect(settingsState.llm_base_url).toBe('https://api.groq.com/openai/v1');
  expect(settingsState.llm_model).toBe('llama-3.3-70b-versatile');
  expect(settingsState.llm_api_key_set).toBe(true);

  // Reloading shows the same preset selected - the draft round-trips.
  await expect(page.getByLabel('Hvor skal svarene laves?')).toHaveValue('groq');
});

test('choosing no provider clears the external endpoint override', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Indstillinger' }).click();
  await page.getByLabel('Hvor skal svarene laves?').selectOption('none');
  await expect(
    page.getByLabel('Endpoint-URL (OpenAI-kompatibel, https)'),
  ).not.toBeVisible();
  await page.getByRole('button', { name: 'Gem indstillinger' }).click();
  await expect(page.getByText('Indstillinger gemt')).toBeVisible();
  expect(settingsState.llm_base_url).toBe(null);
});

test.describe('mobile layout', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('settings page fits a 360px phone viewport without horizontal scroll', async ({
    page,
  }) => {
    await signIn(page);
    await page.getByRole('button', { name: 'Indstillinger' }).click();
    await expect(page.getByRole('heading', { name: 'Indstillinger' })).toBeVisible();
    await openAdvanced(page);

    const metrics = await page.evaluate(() => ({
      scrollW: document.scrollingElement?.scrollWidth ?? 0,
      innerW: window.innerWidth,
    }));
    expect(metrics.scrollW).toBeLessThanOrEqual(metrics.innerW);

    // Every control the admin needs stays fully inside the viewport.
    for (const name of ['Hvor skal svarene laves?', 'Svarmodel (tekst-AI)', 'Nøgle fra udbyderen']) {
      const box = await page.getByLabel(name).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    }
    for (const name of ['Sessioner', 'Vidensbase', 'Auditlog', 'Brugere', 'Indstillinger']) {
      const box = await page.getByRole('button', { name, exact: true }).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width).toBeLessThanOrEqual(360);
    }
  });

  test('login page header fits a 360px phone viewport', async ({ page }) => {
    await mockApi(page);
    await page.goto('/');
    const metrics = await page.evaluate(() => ({
      scrollW: document.scrollingElement?.scrollWidth ?? 0,
      innerW: window.innerWidth,
    }));
    expect(metrics.scrollW).toBeLessThanOrEqual(metrics.innerW);
    const logo = await page.getByRole('img', { name: 'Nordsvar' }).boundingBox();
    expect(logo).not.toBeNull();
    expect(logo!.x).toBeGreaterThanOrEqual(0);
    expect(logo!.x + logo!.width).toBeLessThanOrEqual(360);
  });
});
