import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@persisted-object/react': path.resolve(__dirname, '../../../react/src/index.ts'),
    },
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:8001',
        changeOrigin: true,
        configure: (proxy) => {
          // Prevent redirect responses from exposing the backend origin.
          // FastAPI's redirect_slashes sends 307 to the trailing-slash URL
          // on the backend host, which the browser follows directly,
          // bypassing the proxy and causing CORS errors.
          proxy.on('proxyRes', (proxyRes, req) => {
            const location = proxyRes.headers['location'];
            if (location && (proxyRes.statusCode === 301 || proxyRes.statusCode === 307 || proxyRes.statusCode === 308)) {
              // Rewrite the redirect Location to stay on the proxy
              try {
                const url = new URL(location);
                proxyRes.headers['location'] = url.pathname + url.search;
              } catch {
                // relative URL, leave as-is
              }
            }
          });
        },
      }
    }
  }
})
