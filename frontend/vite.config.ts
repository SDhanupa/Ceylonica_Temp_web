import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Backend for the dev server. Defaults to the Dockerised nginx→php-fpm cluster
// (:3001), which is concurrent, OPcache-warm and ~3-4× faster than the
// single-threaded `php artisan serve` on :8000. Override with VITE_API_TARGET
// (e.g. http://127.0.0.1:8000) to point at a local artisan serve instead.

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = env.VITE_API_TARGET || 'http://127.0.0.1:3002' // public portal API

  return {
    plugins: [react()],
    server: {
      port: 5175, // public portal (main app uses 5173/5174)
      proxy: {
        '/graphql': { target: apiTarget, changeOrigin: true },
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
