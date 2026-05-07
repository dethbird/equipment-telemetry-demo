import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy — forwards API requests to the hapi server running locally.
// In Docker, nginx handles the proxy instead (see nginx.conf).
export default defineConfig({
  plugins: [react()],
  build: {
    assetsDir: '_assets',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
