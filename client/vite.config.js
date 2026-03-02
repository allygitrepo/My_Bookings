import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    cors: true,
    origin: 'http://localhost:5173'
  },
  build: {
    lib: {
      entry: './src/widget-entry.jsx',
      name: 'BookingWidget',
      fileName: () => 'widget.js',
      formats: ['iife'],
    },
    rollupOptions: {
      // By using lib mode, we are building just the widget as a generic script
      // It includes React and ReactDOM inside it for full standalone usage
    }
  },
  define: {
    'process.env.NODE_ENV': '"production"',
  }
})
