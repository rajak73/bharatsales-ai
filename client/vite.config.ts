import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Only VITE_* variables are exposed to client code via import.meta.env.
  envPrefix: ['VITE_'],
  resolve: {
    // @bharatsales/ui is consumed from source; make its imports of these
    // resolve to this app's copies so the bundle ships one of each.
    dedupe: ['react', 'react-dom', 'lucide-react'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 6003,
  },
  preview: {
    port: 6003,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Pages are React.lazy() chunks (see src/App.tsx); recharts and leaflet
    // end up only in the chunks of the pages that use them.
  },
});
