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
    build: {
      rollupOptions: {
        output: {
          // Long-lived vendor chunks: app deploys don't invalidate cached libraries.
          // Split by module path (not package entry) so tree-shaking still drops
          // unused MUI components instead of pulling in the whole barrel file.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return undefined;
            if (/[\/]node_modules[\/](@mui|@emotion)[\/]/.test(id)) return 'mui';
            if (/[\/]node_modules[\/](@apollo|graphql)[\/]/.test(id)) return 'apollo';
            if (/[\/]node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/.test(id)) return 'react';
            return undefined;
          },
        },
      },
    },
    server: {
      port: 5175, // public portal (main app uses 5173/5174)
      proxy: {
        '/graphql': { target: apiTarget, changeOrigin: true },
        '/api': { target: apiTarget, changeOrigin: true },
      },
    },
  }
})
