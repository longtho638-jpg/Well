import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Prevent EPIPE errors by configuring build options appropriately
export default defineConfig({
  // Safari 14+ compatibility — without this, Vite defaults to 'esnext' which
  // emits ES2022+ syntax that Safari cannot parse, causing production crash
  esbuild: {
    target: 'es2020',
  },
  plugins: [
    react(),
  ],

  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
    // Optimize build for stability and prevent EPIPE errors
    cssMinify: 'lightningcss',
    // Reduce parallelism to prevent resource exhaustion
    ssr: false,
    cssCodeSplit: false,
    // PDF chunk is intentionally large (react-pdf/pdfkit) — suppress warning
    chunkSizeWarningLimit: 1600,
    // Reduce memory pressure during build
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // React core — precise matching to avoid catching react-hook-form, react-i18next, etc.
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
            // Animation
            if (id.includes('framer-motion')) return 'animation';
            // Supabase
            if (id.includes('@supabase')) return 'supabase';
            // Icons
            if (id.includes('lucide-react')) return 'icons';
            // i18n
            if (id.includes('i18next')) return 'i18n';
            // Forms
            if (id.includes('zod') || id.includes('react-hook-form') || id.includes('@hookform')) return 'forms';
            // State management
            if (id.includes('zustand')) return 'state';
            // PDF generation (heavy — @react-pdf includes pdfkit, fontkit, etc.)
            if (id.includes('@react-pdf') || id.includes('pdfkit') || id.includes('fontkit')) return 'pdf';
            // Sentry (Monitoring)
            if (id.includes('@sentry')) return 'sentry';
            // DOMPurify (Sanitization)
            if (id.includes('dompurify')) return 'dompurify';

            // Recharts + d3: DO NOT manually chunk — TDZ bug from circular d3 deps (2026-02-08)
            // Vite handles naturally via lazy() boundaries
            if (id.includes('recharts') || id.includes('d3-') || id.includes('victory')) return undefined;

            // Catch-all: Let Vite handle the rest automatically
            // Do NOT force a 'deps' bucket which creates monoliths
            return undefined;
          }
        },
      },
    },
  },
})