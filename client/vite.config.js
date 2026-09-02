import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../server/public',
    emptyOutDir: true
  },
  server: {
    host: true,
    allowedHosts: ['haripc', 'localhost', '127.0.0.1', '.ngrok-free.app'],
    proxy: {
      '/api': {
        target: 'http://localhost:80',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:80',
        ws: true
      }
    }
  }
})
