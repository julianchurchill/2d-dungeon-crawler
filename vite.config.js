import { defineConfig } from 'vite';

/**
 * Vite configuration.
 *
 * Build-time version information (git commit hash, build date, semver) is
 * written to src/build-info.js by scripts/gen-build-info.js, which runs
 * automatically via the predev / prebuild / pretest npm lifecycle hooks.
 * AppVersion.js imports from that file directly — no `define` overrides or
 * child_process calls are needed here.
 */
export default defineConfig({
  // Use the repo subpath when building in GitHub Actions so asset URLs are
  // correct on GitHub Pages (https://<user>.github.io/<repo>/). Locally,
  // relative paths keep the dev server and `vite preview` working without any
  // server configuration.
  base: process.env.GITHUB_ACTIONS ? '/2d-dungeon-crawler/' : './',
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
