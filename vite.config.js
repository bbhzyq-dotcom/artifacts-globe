import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: ['.monkeycode-ai.online']
  },
  optimizeDeps: {
    include: ['earth-flyline']
  },
  build: {
    target: 'esnext'
  }
})
