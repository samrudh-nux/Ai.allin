import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: './postcss.config.js',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:7860', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:7860', ws: true, changeOrigin: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'motion': ['framer-motion'],
          'map': ['leaflet', 'react-leaflet'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
});
