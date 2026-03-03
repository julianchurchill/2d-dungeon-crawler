import { defineConfig } from 'vite';

export default defineConfig({
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
