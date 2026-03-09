import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  esbuild: {
    target: 'es2020',
    keepNames: true,
    legalComments: 'none',
    pure: ['console.log'], // Remove console.log in production
    drop: ['debugger'], // Remove debugger statements
  },
  cacheDir: '.vite',
  plugins: [
    react(),
    process.env.ANALYZE === 'true' ? visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }) : null,
    ViteImageOptimizer({
      // Convert images to WebP/AVIF for better compression
      includePublic: false,
      logStats: true,
      svg: {
        multipass: true,
        plugins: [{
          name: 'preset-default',
          params: {
            overrides: { cleanupNumericValues: false }
          }
        }]
      },
      png: {
        // Lossless compression
        quality: 80
      },
      jpeg: {
        // Convert to WebP
        quality: 80
      },
      jpg: {
        // Convert to WebP
        quality: 80
      },
      webp: {
        // AVIF alternative
        quality: 85
      }
    })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'es2020',
    cssTarget: 'es2020',
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    ssr: false,
    chunkSizeWarningLimit: 500, // Aggressive splitting
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    // Rollup optimization
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React stack
            if (
              id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')
            ) {
              return 'react-vendor';
            }
            // Query & caching
            if (id.includes('@tanstack')) return 'tanstack';
            // AI/ML libraries - heavy, separate chunk
            if (id.includes('@ai-sdk') || id.includes('ai')) return 'ai-sdk';
            // Animation - combine with ai-sdk to avoid circular dependency
            if (id.includes('framer-motion')) return 'ai-animation';
            // Backend services
            if (id.includes('@supabase')) return 'supabase';
            // Icons - tree-shakeable
            if (id.includes('lucide-react')) return 'icons';
            // i18n
            if (id.includes('i18next')) return 'i18n';
            // Forms & validation
            if (id.includes('zod') || id.includes('react-hook-form')) return 'forms';
            // State management
            if (id.includes('zustand')) return 'state';
            // Error tracking
            if (id.includes('@sentry')) return 'sentry';
            // Charts - heavy visualization (keep separate from ai-sdk)
            if (id.includes('recharts')) return 'charts';
            if (id.includes('react-js-geometry') || id.includes('react-js-surface')) return 'charts-utils';
            // PDF - very heavy, lazy load
            if (id.includes('@react-pdf') || id.includes('pdfkit') || id.includes('react-pdf')) return 'pdf';
          }
          return undefined;
        },
        // Optimize chunk loading
        inlineDynamicImports: false,
        // Improve caching
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand', '@tanstack/react-query'],
    exclude: ['@react-pdf/renderer', 'recharts', 'pdfkit', '@ai-sdk/*', 'ai'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
})
