import { defineConfig } from 'vite';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

/**
 * Reads the semantic version from package.json, the short git commit hash from
 * the current HEAD, and the current UTC date/time.  These are injected as
 * global constants at build (and dev-server start) time via Vite's `define`
 * plugin so that src/utils/AppVersion.js can expose them at runtime without
 * making any network or filesystem calls.
 */
const pkg       = JSON.parse(readFileSync('./package.json', 'utf-8'));
const gitCommit = (() => {
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    // Outside a git repository (e.g. CI artifact build without git history)
    return 'unknown';
  }
})();
const buildDate = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __GIT_COMMIT__:  JSON.stringify(gitCommit),
    __BUILD_DATE__:  JSON.stringify(buildDate),
  },
  base: './',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    host: true,
    port: 3000,
    watch: {
      // inotify is unreliable in WSL2 devcontainers; polling ensures file
      // changes are always detected so HMR works correctly.
      usePolling: true,
    },
  },
});
