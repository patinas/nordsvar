// Live screen-share E2E: the caller shares their screen (getDisplayMedia,
// never camera) into a real LiveKit room, and we verify the share actually
// reached the media server by asking livekit-server's own REST API for the
// room's tracks. This is the assertion a mocked spec cannot make: pixels
// from the browser arrive server-side as a SCREEN_SHARE track.
import { test, expect } from '@playwright/test';
import { createHmac } from 'node:crypto';
import { readFileSync } from 'node:fs';

const TENANT = '3f6b1c2e-0000-4000-8000-abcdefabcdef';
const API_KEY = 'e2ekey';
const API_SECRET = 'e2esecret-e2esecret-e2esecret-12';
const STACK_FILE = '/tmp/nordsvar-live-stack.json';

// Minimal HS256 LiveKit server-API token (grants live under "video").
function livekitApiToken(grants: Record<string, unknown>): string {
  const b64url = (o: object | string) =>
    Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
  const header = b64url({ alg: 'HS256', typ: 'JWT' });
  const payload = b64url({
    iss: API_KEY,
    exp: Math.floor(Date.now() / 1000) + 300,
    nbf: Math.floor(Date.now() / 1000) - 10,
    video: grants,
  });
  const sig = createHmac('sha256', API_SECRET).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${sig}`;
}

async function lkPost(
  lkHttpUrl: string,
  service: string,
  body: object,
  grants: Record<string, unknown> = { roomList: true },
): Promise<any> {
  const resp = await fetch(`${lkHttpUrl}/twirp/livekit.RoomService/${service}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${livekitApiToken(grants)}`,
    },
    body: JSON.stringify(body),
  });
  if (!resp.ok) throw new Error(`${service} -> HTTP ${resp.status}: ${await resp.text()}`);
  return resp.json();
}

test.skip(!process.env.LIVEKIT_SERVER_BIN, 'LIVEKIT_SERVER_BIN unset; live stack unavailable');

test('screen share publishes a real SCREEN_SHARE track to the media server', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.goto('/');
  await page.getByLabel('Tenant-ID').fill(TENANT);
  await page.getByLabel('Bruger-ID').fill('andreas');
  await page.getByRole('button', { name: 'Fortsæt' }).click();
  await page.getByRole('button', { name: 'Start session' }).click();
  await expect(page.getByText('● Forbundet')).toBeVisible({ timeout: 30_000 });

  const stack = JSON.parse(readFileSync(STACK_FILE, 'utf8')) as { livekitUrl: string };
  const lkHttp = stack.livekitUrl.replace(/^ws:\/\//, 'http://');

  // Start the share. The button only flips after getDisplayMedia resolved
  // and the track was published to the room.
  await page.getByRole('button', { name: 'Del skærm' }).click();
  await expect(page.getByRole('button', { name: 'Stop skærmdeling' })).toBeVisible({ timeout: 15_000 });

  // Server-side truth: some participant in the session room publishes a
  // track whose source is SCREEN_SHARE (LiveKit proto enum value 2,
  // serialized as the string name in JSON).
  await expect
    .poll(
      async () => {
        try {
          const rooms = await lkPost(lkHttp, 'ListRooms', {});
          for (const room of rooms.rooms ?? []) {
            const participants = await lkPost(lkHttp, 'ListParticipants', { room: room.name }, { roomAdmin: true, room: room.name });
            for (const p of participants.participants ?? []) {
              for (const t of p.tracks ?? []) {
                if (t.source === 'SCREEN_SHARE' || t.source === 2) return true;
              }
            }
          }
        } catch {
          /* server briefly mid-join; keep polling */
        }
        return false;
      },
      { timeout: 20_000, intervals: [500, 1_000, 2_000] },
    )
    .toBe(true);

  await page.screenshot({ path: 'test-results/live-screen-share.png' });

  // Stopping the share removes the server-side track too.
  await page.getByRole('button', { name: 'Stop skærmdeling' }).click();
  await expect(page.getByRole('button', { name: 'Del skærm' })).toBeVisible({ timeout: 10_000 });
  await expect
    .poll(
      async () => {
        try {
          const rooms = await lkPost(lkHttp, 'ListRooms', {});
          for (const room of rooms.rooms ?? []) {
            const participants = await lkPost(lkHttp, 'ListParticipants', { room: room.name }, { roomAdmin: true, room: room.name });
            for (const p of participants.participants ?? []) {
              for (const t of p.tracks ?? []) {
                if (t.source === 'SCREEN_SHARE' || t.source === 2) return false;
              }
            }
          }
        } catch {
          /* keep polling */
        }
        return true;
      },
      { timeout: 15_000, intervals: [500, 1_000, 2_000] },
    )
    .toBe(true);

  await page.getByRole('button', { name: 'Afslut session' }).click();
  await expect(page.getByText('Sessionen er afsluttet.')).toBeVisible({ timeout: 10_000 });
  expect(consoleErrors).toEqual([]);
});
