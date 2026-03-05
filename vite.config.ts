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
    cssMinify: 'esbuild',
    cssCodeSplit: true,
    ssr: false,
    chunkSizeWarningLimit: 1000, // Increased limit for heavy charts
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
    // Rollup optimization
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
            if (id.includes('recharts') || id.includes('react-js-geometry') || id.includes('react-js-surface')) return 'charts';
            // Heavy PDF library - separate chunk for lazy loading
            if (id.includes('@react-pdf') || id.includes('pdfkit') || id.includes('react-pdf')) return 'pdf';
          }
          return undefined;
        },
        // Optimize chunk loading
        inlineDynamicImports: false,
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'zustand'],
    exclude: ['@react-pdf/renderer', 'recharts', 'pdfkit', '@ai-sdk/*', 'ai'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
})
