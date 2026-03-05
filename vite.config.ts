import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  esbuild: {
    target: 'es2020',
    keepNames: true,
    legalComments: 'none',
  },
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
    // Optimized for Apple Silicon: balanced parallel ops
    rollupOptions: {
      maxParallelFileOps: 4,
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/scheduler/') ||
              id.includes('node_modules/@remix-run/')
            ) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) return 'animation';
            if (id.includes('@supabase')) return 'supabase';
            if (id.includes('lucide-react')) return 'icons';
            if (id.includes('i18next')) return 'i18n';
            if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) return 'forms';
            if (id.includes('zustand')) return 'state';
            if (id.includes('@react-pdf') || id.includes('pdfkit') || id.includes('fontkit')) return 'pdf';
            if (id.includes('@sentry')) return 'sentry';
            if (id.includes('dompurify')) return 'dompurify';
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return 'charts';
            if (id.includes('lodash')) return 'lodash';
          }
          return undefined;
        },
      },
    },
    minify: 'esbuild',
    sourcemap: false,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    exclude: ['@react-pdf/renderer', 'recharts', 'pdfkit'],
  },
})
