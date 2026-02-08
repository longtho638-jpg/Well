import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core vendor chunk (React ecosystem)
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor';
            }
            // UI chunk (Animation)
            if (id.includes('framer-motion')) {
              return 'ui';
            }
            // Recharts: let Vite handle naturally via lazy() boundaries
            // Manual chunking caused TDZ errors from circular d3 deps
            // Utils chunk (i18n, common utilities)
            if (id.includes('i18next') || id.includes('react-i18next') || id.includes('zod') || id.includes('react-hook-form')) {
              return 'utils';
            }
            // Icons chunk
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Supabase chunk
            if (id.includes('@supabase')) {
              return 'supabase';
            }
          }
        },
      },
    },
  },
})