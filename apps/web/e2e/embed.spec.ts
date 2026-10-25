// Embed widget + PWA + admin integration section (mocked API). The widget
// test serves a bare HTML page that embeds the real built /embed/v1.js,
// with the public API mocked at the fetch layer.
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const CONFIG = {
  theme_color: '#123456',
  position: 'left',
  language: 'da',
  voice_enabled: false,
};

function mockEmbedApi(page: import('@playwright/test').Page, configStatus = 200) {
  return page.route('**/v1/public/embed/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/embed/config')) {
      return route.fulfill({
        status: configStatus,
        contentType: 'application/json',
        body: JSON.stringify(CONFIG),
      });
    }
    if (url.pathname.endsWith('/embed/session')) {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ session_id: 'emb-1', expires_in_secs: 1800 }),
      });
    }
    if (url.pathname.endsWith('/embed/message')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          answer: 'Vi har åbent til kl. 16.',
          citations: [{ source: 'aabningstider.pdf' }],
        }),
      });
    }
    return route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
  });
}

async function widgetHost(page: import('@playwright/test').Page) {
  // A minimal customer page embedding the widget bundle. Same-origin on
  // the preview server: Chromium's Private Network Access blocks a fake
  // public host from loading a loopback script, so the fixture page lives
  // under the preview origin itself. The script tag carries the public
  // key like a real install.
  await page.route('**/kunde-side', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><html lang="da"><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width">
        <title>Kunde side</title></head><body>
        <h1>Kunde side</h1>
        <script src="/embed/v1.js" charset="utf-8" data-nordsvar-key="pk_test123" async></` + `script>
      </body></html>`,
    });
  });
  await page.goto('/kunde-side');
}

test('widget opens, applies config, and answers a message', async ({ page }) => {
  await mockEmbedApi(page);
  await widgetHost(page);
  const bubble = page.locator('nordsvar-widget').locator('css=internal:control=button');
  // Shadow DOM: pierce via locator on the custom element.
  const host = page.locator('nordsvar-widget');
  await expect(host).toBeAttached();
  const bubbleBtn = host.locator('button.bubble');
  await bubbleBtn.click();
  const panel = host.locator('section.panel');
  await expect(panel).toBeVisible();
  await expect(host.locator('.head h2')).toHaveText('Spørg os');
  const input = host.locator('.composer input');
  await input.fill('Hvornår lukker I?');
  await host.locator('.composer button').click();
  await expect(host.locator('.msg.bot').first()).toContainText('Vi har åbent til kl. 16.');
  await expect(host.locator('.cite').first()).toContainText('aabningstider.pdf');
});

test('widget panel is full-sheet on a 390px viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockEmbedApi(page);
  await widgetHost(page);
  const host = page.locator('nordsvar-widget');
  await host.locator('button.bubble').click();
  const box = await host.locator('section.panel').boundingBox();
  expect(box).not.toBeNull();
  expect(Math.round(box!.width)).toBe(390);
});

test('widget shows an honest error state on a disallowed domain', async ({ page }) => {
  await mockEmbedApi(page, 403);
  await widgetHost(page);
  const host = page.locator('nordsvar-widget');
  await host.locator('button.bubble').click();
  await expect(host.locator('.msg.note')).toContainText(
    'Chatten er ikke tilgængelig på denne side.',
  );
});

test('widget passes an accessibility scan', async ({ page }) => {
  await mockEmbedApi(page);
  await widgetHost(page);
  const host = page.locator('nordsvar-widget');
  await host.locator('button.bubble').click();
  const results = await new AxeBuilder({ page }).include('nordsvar-widget').analyze();
  const serious = results.violations.filter(
    (v) => v.impact === 'serious' || v.impact === 'critical',
  );
  expect(serious).toEqual([]);
});

test('PWA manifest is linked and served', async ({ page }) => {
  await page.route('**/v1/setup/status', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ needs_setup: false, auth_mode: 'local' }),
    });
  });
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBe('/manifest.webmanifest');
  const resp = await page.request.get('/manifest.webmanifest');
  expect(resp.status()).toBe(200);
  const manifest = await resp.json();
  expect(manifest.name).toBe('Nordsvar');
  expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
});
