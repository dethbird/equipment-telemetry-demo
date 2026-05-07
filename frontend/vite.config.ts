import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy — forwards API requests to the hapi server running locally.
// In Docker, nginx handles the proxy instead (see nginx.conf).
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/assets': 'http://localhost:3001',
      '/telemetry': 'http://localhost:3001',
      '/work-orders': 'http://localhost:3001',
      '/maintenance-rules': 'http://localhost:3001',
      '/health': 'http://localhost:3001',
    },
  },
});
