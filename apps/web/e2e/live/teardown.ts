// Live-stack teardown. Separate file on purpose: Playwright loads the
// DEFAULT export for both globalSetup and globalTeardown, so a single
// shared file runs SETUP twice and never tears down (learned the hard
// way: the second setup spawned a whole second stack and leaked it).
import { execFileSync } from 'node:child_process';
import { readFileSync, rmSync, existsSync } from 'node:fs';

const STACK_FILE = '/tmp/nordsvar-live-stack.json';

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

export default async function globalTeardown() {
  console.log(`[stack] globalTeardown enter at ${new Date().toISOString()}`);
  if (!existsSync(STACK_FILE)) return;
  try {
    const stack = JSON.parse(readFileSync(STACK_FILE, 'utf8'));
    for (const pid of stack.pids ?? []) {
      try {
        process.kill(-pid, 'SIGKILL'); // detached: each child leads its group
      } catch {
        try {
          process.kill(pid, 'SIGKILL');
        } catch {
          /* already gone */
        }
      }
    }
    killPort(38111);
  } finally {
    rmSync(STACK_FILE, { force: true });
  }
}
