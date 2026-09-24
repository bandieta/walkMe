import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Built as static files and served by Nginx alongside the API (see
// deploy/hostinger/README.md). Override VITE_API_BASE_URL at build time to
// point at the deployed server; it defaults to the local dev server.
export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  build: {
    outDir: 'dist',
  },
});
