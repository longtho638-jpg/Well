import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Safari 14+ compatibility — without this, Vite defaults to 'esnext' which
  // emits ES2022+ syntax that Safari cannot parse, causing production crash
  esbuild: {
    target: 'es2020',
  },
  plugins: [
    react(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    //   manifest: {
    //     name: 'WellNexus - Distributor Portal',
    //     short_name: 'WellNexus',
    //     description: 'Premium health product distribution platform with multi-level commission system',
    //     theme_color: '#6366f1',
    //     background_color: '#0a0a0f',
    //     display: 'standalone',
    //     orientation: 'portrait-primary',
    //     scope: '/',
    //     start_url: '/',
    //     icons: [
    //       {
    //         src: '/icons/icon-72x72.png',
    //         sizes: '72x72',
    //         type: 'image/png',
    //         purpose: 'any'
    //       },
    //       {
    //         src: '/icons/icon-96x96.png',
    //         sizes: '96x96',
    //         type: 'image/png',
    //         purpose: 'any'
    //       },
    //       {
    //         src: '/icons/icon-128x128.png',
    //         sizes: '128x128',
    //         type: 'image/png',
    //         purpose: 'any'
    //       },
    //       {
    //         src: '/icons/icon-144x144.png',
    //         sizes: '144x144',
    //         type: 'image/png',
    //         purpose: 'any'
    //       },
    //       {
    //         src: '/icons/icon-152x152.png',
    //         sizes: '152x152',
    //         type: 'image/png',
    //         purpose: 'any'
    //       },
    //       {
    //         src: '/icons/icon-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       },
    //       {
    //         src: '/icons/icon-384x384.png',
    //         sizes: '384x384',
    //         type: 'image/png',
    //         purpose: 'any'
    //       },
    //       {
    //         src: '/icons/icon-512x512.png',
    //         sizes: '512x512',
    //         type: 'image/png',
    //         purpose: 'any maskable'
    //       }
    //     ],
    //     screenshots: [
    //       {
    //         src: '/screenshots/desktop-1.png',
    //         sizes: '1920x1080',
    //         type: 'image/png',
    //         form_factor: 'wide',
    //         label: 'Dashboard overview'
    //       },
    //       {
    //         src: '/screenshots/mobile-1.png',
    //         sizes: '750x1334',
    //         type: 'image/png',
    //         form_factor: 'narrow',
    //         label: 'Mobile dashboard'
    //       }
    //     ],
    //     shortcuts: [
    //       {
    //         name: 'View Orders',
    //         short_name: 'Orders',
    //         description: 'View your recent orders',
    //         url: '/orders',
    //         icons: [{ src: '/icons/shortcut-orders.png', sizes: '96x96' }]
    //       },
    //       {
    //         name: 'Scan QR',
    //         short_name: 'Scan',
    //         description: 'Scan product QR code',
    //         url: '/scan',
    //         icons: [{ src: '/icons/shortcut-scan.png', sizes: '96x96' }]
    //       },
    //       {
    //         name: 'Commission',
    //         short_name: 'Commission',
    //         description: 'View commission earnings',
    //         url: '/commission',
    //         icons: [{ src: '/icons/shortcut-commission.png', sizes: '96x96' }]
    //       }
    //     ],
    //     categories: ['business', 'productivity', 'health'],
    //     iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
    //     share_target: {
    //       action: '/share',
    //       method: 'POST',
    //       enctype: 'multipart/form-data',
    //       params: {
    //         title: 'title',
    //         text: 'text',
    //         url: 'url'
    //       }
    //     }
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
    //     runtimeCaching: [
    //       {
    //         urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'google-fonts-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       },
    //       {
    //         urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'gstatic-fonts-cache',
    //           expiration: {
    //             maxEntries: 10,
    //             maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       },
    //       {
    //         urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
    //         handler: 'CacheFirst',
    //         options: {
    //           cacheName: 'images-cache',
    //           expiration: {
    //             maxEntries: 60,
    //             maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    //           }
    //         }
    //       },
    //       {
    //         urlPattern: /\/api\/.*/i,
    //         handler: 'NetworkFirst',
    //         options: {
    //           cacheName: 'api-cache',
    //           networkTimeoutSeconds: 10,
    //           expiration: {
    //             maxEntries: 50,
    //             maxAgeSeconds: 60 * 5 // 5 minutes
    //           },
    //           cacheableResponse: {
    //             statuses: [0, 200]
    //           }
    //         }
    //       }
    //     ]
    //   },
    //   devOptions: {
    //     enabled: false // Enable in development if needed
    //   }
    // })
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: ['es2020', 'safari14', 'chrome87', 'firefox78'],
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
            // Workbox (PWA)
            if (id.includes('workbox')) return 'workbox';

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