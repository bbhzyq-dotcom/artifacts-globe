import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: ['.monkeycode-ai.online']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  resolve: {
    alias: {
      '@': '/workspace'
    }
  }
});
