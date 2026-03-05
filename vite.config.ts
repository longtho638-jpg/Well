import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  esbuild: {
    target: 'es2020',
    keepNames: true,
    legalComments: 'none',
  },
  cacheDir: '.vite',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    ssr: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) return 'animation';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('i18next')) return 'i18n';
            if (id.includes('zod') || id.includes('react-hook-form')) return 'forms';
            if (id.includes('zustand')) return 'state';
            if (id.includes('@sentry')) return 'sentry';
            if (id.includes('@react-pdf') || id.includes('pdfkit')) return 'react-pdf';
          }
          return undefined;
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    exclude: ['@react-pdf/renderer', 'recharts', 'pdfkit', '@ai-sdk/*', 'ai'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
})
