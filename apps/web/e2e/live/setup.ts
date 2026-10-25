// Live-stack harness for the browser E2E: starts livekit-server, the real
// API, and the real AI worker, then hands their ports to the test run via
// /tmp/nordsvar-live-stack.json (read by vite.config.ts for the preview
// proxy and by the specs for assertions). Skips cleanly when
// LIVEKIT_SERVER_BIN is unset.
import { spawn, execFileSync, type ChildProcess } from 'node:child_process';
import { createServer, createConnection } from 'node:net';
import { openSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const STACK_FILE = '/tmp/nordsvar-live-stack.json';
const WORKER_LOG = '/tmp/nordsvar-worker-live.log';
const API_LOG = '/tmp/nordsvar-api-live.log';
const API_KEY = 'e2ekey';
const API_SECRET = 'e2esecret-e2esecret-e2esecret-12';
const INTERNAL_TOKEN = 'internal-test-token';

async function freePort(): Promise<number> {
  return new Promise((res, rej) => {
    const srv = createServer();
    srv.once('error', rej);
    srv.listen(0, '127.0.0.1', () => {
      const addr = srv.address();
      if (addr && typeof addr === 'object') {
        const port = addr.port;
        srv.close(() => res(port));
      } else {
        rej(new Error('no address'));
      }
    });
  });
}

function waitFor(url: string, tries = 60): Promise<void> {
  return new Promise((res, rej) => {
    const attempt = (left: number) => {
      fetch(url)
        .then((r) => (r.ok ? res() : retry(left)))
        .catch(() => retry(left));
    };
    const retry = (left: number) => {
      if (left <= 0) return rej(new Error(`never came up: ${url}`));
      setTimeout(() => attempt(left - 1), 250);
    };
    attempt(tries);
  });
}

const children: ChildProcess[] = [];

/// Kill whatever listens on a TCP port. Failed runs leak servers (the
/// stack file with their pids may never be written), and a leaked API or
/// preview silently serves the NEXT run with stale state.
function killPort(port: number) {
  try {
    const out = execFileSync('ss', ['-tlnpH', `sport = :${port}`], { encoding: 'utf8' });
    for (const m of out.matchAll(/pid=(\d+)/g)) {
      try {
        process.kill(Number(m[1]), 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  } catch {
    /* ss found nothing or is unavailable */
  }
}

export default async function globalSetup() {
  console.log(`[stack] globalSetup enter pid=${process.pid} at ${new Date().toISOString()}`);
  const bin = process.env.LIVEKIT_SERVER_BIN;
  if (!bin) {
    // Specs skip themselves on the same variable.
    rmSync(STACK_FILE, { force: true });
    return;
  }
  // Sweep leaked servers from crashed runs: they hold the fixed ports
  // (API 38111, LiveKit dev-mode UDP 7882) and silently poison the next
  // run. Patterns match only this project's test processes. 4173 belongs
  // to Playwright's webServer, which may already be up (it starts before
  // globalSetup) - leave it alone.
  for (const pattern of ['livekit-server --dev', 'target/debug/nordsvar-api', 'target/debug/nordsvar-ai-worker']) {
    try {
      execFileSync('pkill', ['-f', pattern]);
    } catch {
      /* nothing matched */
    }
  }
  killPort(38111);
  await new Promise((r) => setTimeout(r, 500));
  rmSync(WORKER_LOG, { force: true });
  rmSync(API_LOG, { force: true });

  const lkPort = await freePort();
  const lk = spawn(
    bin,
    ['--dev', '--bind', '127.0.0.1', '--port', String(lkPort), '--keys', `${API_KEY}: ${API_SECRET}`],
    { stdio: 'ignore', detached: true },
  );
  children.push(lk);

  // Fixed port: vite preview's proxy targets it statically, and Playwright
  // gives no ordering guarantee between webServer and globalSetup.
  // Wait for the LiveKit signaling port before anything can join a room.
  for (let i = 0; i < 240; i++) {
    const up = await new Promise<boolean>((res) => {
      const sock = createConnection({ host: '127.0.0.1', port: lkPort });
      sock.once('connect', () => {
        sock.end();
        res(true);
      });
      sock.once('error', () => res(false));
    });
    if (up) break;
    if (i === 239) { try { lk.kill('SIGKILL'); } catch {} throw new Error('livekit-server never came up'); }
    await new Promise((r) => setTimeout(r, 250));
  }

  const apiPort = 38111;
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../..');
  const apiLogFd = openSync(API_LOG, 'w');
  const api = spawn(resolve(repoRoot, 'target/debug/nordsvar-api'), {
    stdio: ['ignore', apiLogFd, apiLogFd],
    detached: true,
    env: {
      ...process.env,
      BIND_ADDR: `127.0.0.1:${apiPort}`,
      LIVEKIT_URL: `ws://127.0.0.1:${lkPort}`,
      LIVEKIT_API_KEY: API_KEY,
      LIVEKIT_API_SECRET: API_SECRET,
      INTERNAL_TOKEN,
      AUTH_MODE: 'dev',
    },
  });
  children.push(api);
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  await waitFor(`${apiUrl}/healthz`);

  const workerLogFd = openSync(WORKER_LOG, 'w');
  const worker = spawn(resolve(repoRoot, 'target/debug/nordsvar-ai-worker'), {
    stdio: ['ignore', workerLogFd, workerLogFd],
    detached: true,
    env: {
      ...process.env,
      API_URL: apiUrl,
      INTERNAL_TOKEN,
      LIVEKIT_URL: `ws://127.0.0.1:${lkPort}`,
      LIVEKIT_API_KEY: API_KEY,
      LIVEKIT_API_SECRET: API_SECRET,
      // Dead model endpoints on purpose: pipeline failures must not stop
      // the media path (increment 15).
      STT_URL: 'http://127.0.0.1:1',
      LLM_URL: 'http://127.0.0.1:1',
      TTS_URL: 'http://127.0.0.1:1',
      EMBED_URL: 'http://127.0.0.1:1',
      QDRANT_URL: 'http://127.0.0.1:1',
      MEDIA_DRIVER: 'livekit',
      RUST_LOG: 'nordsvar_ai_worker=debug',
      NORDSVAR_LK_DEBUG: '1',
    },
  });
  children.push(worker);

  writeFileSync(
    STACK_FILE,
    JSON.stringify({
      apiUrl,
      livekitUrl: `ws://127.0.0.1:${lkPort}`,
      pids: children.map((c) => c.pid),
    }),
  );

  // The setup process exits while the servers keep running; detach them.
  // vite preview is started by the webServer command (serve.mjs), which
  // waits for the stack file - so Playwright's startup order does not
  // matter.
  for (const c of children) c.unref();
  console.log(`[stack] globalSetup done at ${new Date().toISOString()}`);
}

