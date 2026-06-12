// Vite config: React plugin and a dev-server proxy so the frontend can call
// the API at /api without CORS concerns during local development.
import path from 'node:path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // More-specific aliases must come before the catch-all '@' so Vite
      // matches them first (aliases use prefix matching).
      '@api': path.resolve(__dirname, './src/api'),
      '@auth': path.resolve(__dirname, './src/auth'),
      '@components': path.resolve(__dirname, './src/components'),
      '@features': path.resolve(__dirname, './src/features'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      // Defaults to the host-published API port; the dockerized dev server
      // overrides this to reach the server container directly.
      '/api': process.env.API_PROXY_TARGET ?? 'http://localhost:4000',
    },
  },
});
