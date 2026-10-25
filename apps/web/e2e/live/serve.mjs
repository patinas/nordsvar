// webServer command for the live config: build the app and serve it in the
// foreground. No waiting on the stack here - Playwright starts webServer
// and globalSetup in an order we cannot rely on, and the preview proxy
// target is a fixed port (see vite.config.ts).
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, statSync, readdirSync } from 'node:fs';

// Skip the rebuild when dist/ is already newer than every source file -
// the concurrent build starves the live stack's startup in globalSetup.
function distIsFresh() {
  if (!existsSync('dist/index.html')) return false;
  const distTime = statSync('dist/index.html').mtimeMs;
  const walk = (dir) =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`],
    );
  return walk('src').every((f) => statSync(f).mtimeMs < distTime);
}
if (!distIsFresh()) {
  execFileSync('npm', ['run', 'build'], { stdio: 'inherit' });
} else {
  console.log('[serve] dist is fresh; skipping build');
}
const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'],
  { stdio: 'inherit' },
);
preview.on('exit', (code) => process.exit(code ?? 1));
