import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isWidget = process.env.BUILD_WIDGET === 'true';

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      cors: true,
      origin: 'http://localhost:5173',
    },
    build: isWidget ? {
      outDir: 'dist',
      emptyOutDir: false, // Keep previous build (dashboard) if build:all is run
      lib: {
        entry: './src/widget-entry.jsx',
        name: 'BookingWidget',
        fileName: () => 'widget.js',
        formats: ['iife'],
      },
      rollupOptions: {
        // standalone script including react
      },
    } : {
      outDir: 'dist',
      emptyOutDir: true,
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    }
  };
});
