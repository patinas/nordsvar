// Live join flow: sign in, start a session, connect to a real LiveKit room
// (fake mic), hang up, and prove the worker's AI session ended too.
import { test, expect } from '@playwright/test';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const TENANT = '3f6b1c2e-0000-4000-8000-abcdefabcdef';
const WORKER_LOG = '/tmp/nordsvar-worker-live.log';
const API_LOG = '/tmp/nordsvar-api-live.log';
const STACK_FILE = '/tmp/nordsvar-live-stack.json';
const INTERNAL_TOKEN = 'internal-test-token';

function readTail(path: string): string {
  try {
    return readFileSync(path, 'utf8').split('\n').slice(-40).join('\n');
  } catch {
    return '<missing>';
  }
}

// When the worker does not claim, dump everything that distinguishes a dead
// worker, a stuck poll, and an API that never listed the session.
async function diagnoseClaimFailure(): Promise<void> {
  try {
    console.log('[diag] worker procs:\n' + execSync('pgrep -fa nordsvar-ai-worker || true').toString());
  } catch (e) {
    console.log('[diag] pgrep failed: ' + e);
  }
  let apiUrl = '';
  try {
    apiUrl = JSON.parse(readFileSync(STACK_FILE, 'utf8')).apiUrl;
  } catch {
    /* no stack file */
  }
  if (apiUrl) {
    for (const tag of ['t0', 't+5s']) {
      try {
        const r = await fetch(`${apiUrl}/v1/internal/sessions/unclaimed`, {
          headers: { 'x-internal-token': INTERNAL_TOKEN },
        });
        console.log(`[diag] unclaimed ${tag}: ${r.status} ` + JSON.stringify(await r.json()));
      } catch (e) {
        console.log(`[diag] unclaimed ${tag}: fetch failed: ` + e);
      }
      if (tag === 't0') await new Promise((r) => setTimeout(r, 5000));
    }
  }
  console.log('[diag] worker log tail:\n' + readTail(WORKER_LOG));
  console.log('[diag] api log tail:\n' + readTail(API_LOG));
}

test.skip(!process.env.LIVEKIT_SERVER_BIN, 'LIVEKIT_SERVER_BIN unset; live stack unavailable');

test('browser joins a real room with the AI and hanging up ends it', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');
  await page.getByLabel('Tenant-ID').fill(TENANT);
  await page.getByLabel('Bruger-ID').fill('andreas');
  await page.getByRole('button', { name: 'Fortsæt' }).click();
  await expect(page.getByRole('heading', { name: 'Supportsession' })).toBeVisible();

  await page.getByRole('button', { name: 'Start session' }).click();
  // Real create -> join -> LiveKit connect with a fake microphone.
  await expect(page.getByText('● Forbundet')).toBeVisible({ timeout: 30_000 });
  await page.screenshot({ path: 'test-results/live-connected.png' });

  // The worker must claim the session before we hang up; if this poll times
  // out, dump the diagnostic bundle (worker liveness, unclaimed list, logs).
  try {
    await expect
      .poll(
        () => {
          try {
            return readFileSync(WORKER_LOG, 'utf8');
          } catch {
            return '';
          }
        },
        { timeout: 20_000, intervals: [500, 1_000, 2_000] },
      )
      .toContain('claimed sessions');
  } catch (e) {
    await diagnoseClaimFailure();
    throw e;
  }

  await page.getByRole('button', { name: 'Afslut session' }).click();
  await expect(page.getByText('Sessionen er afsluttet.')).toBeVisible({ timeout: 10_000 });

  // The room is now empty: the worker's AI session must end (increment 18).
  await expect
    .poll(
      () => {
        try {
          return readFileSync(WORKER_LOG, 'utf8');
        } catch {
          return '';
        }
      },
      { timeout: 30_000, intervals: [500, 1_000, 2_000] },
    )
    .toContain('session finished');

  expect(consoleErrors).toEqual([]);
});
