# Phase 03: PWA Enhancement

## Context

Transform WellNexus into a fully installable Progressive Web App with offline capability, app-like experience, and Lighthouse PWA score 90+.

**Current State:**
- Basic PWA setup with manifest.json
- Service worker registration present but minimal caching
- No offline fallback pages
- PWA install prompt not optimized

**Target State:**
- Lighthouse PWA score 90+
- Installable on iOS, Android, Desktop (Chrome/Edge)
- Offline mode with cached shell and critical data
- App-like experience with splash screens and shortcuts
- Push notification infrastructure (optional)

## Requirements

### Functional Requirements
- **FR-01:** Service worker with precache + runtime cache strategy
- **FR-02:** Offline fallback page with Aura Elite design
- **FR-03:** Install prompt with custom UI (not browser default)
- **FR-04:** App shortcuts for quick actions (e.g., "View Orders", "Scan QR")
- **FR-05:** Splash screens for all platforms (iOS, Android)

### Non-Functional Requirements
- **NFR-01:** Lighthouse PWA score 90+
- **NFR-02:** Service worker cache size < 10MB
- **NFR-03:** Install prompt shows after 2 page views (delayed)
- **NFR-04:** Offline mode loads in < 1 second

## Architecture

### Service Worker Strategy

```
┌─────────────────────────────────────────────────────┐
│ Service Worker Lifecycle                            │
├─────────────────────────────────────────────────────┤
│                                                      │
│  INSTALL → Precache shell (HTML, CSS, JS, fonts)    │
│     ↓                                                │
│  ACTIVATE → Clean old caches                         │
│     ↓                                                │
│  FETCH → Intercept requests:                         │
│           - Shell: Cache-First                       │
│           - API: Network-First (cache fallback)      │
│           - Images: Cache-First (CDN)                │
│           - Offline: Show fallback page              │
└─────────────────────────────────────────────────────┘
```

### Cache Layers

```
┌────────────────┬──────────────────┬──────────────┐
│ Cache Name     │ Strategy         │ Max Age      │
├────────────────┼──────────────────┼──────────────┤
│ shell-v1       │ Cache-First      │ 7 days       │
│ api-v1         │ Network-First    │ 5 minutes    │
│ images-v1      │ Cache-First      │ 30 days      │
│ fonts-v1       │ Cache-First      │ 365 days     │
└────────────────┴──────────────────┴──────────────┘
```

### File Structure

```
public/
├── manifest.json                    # Enhanced manifest
├── sw.js                            # Service worker (generated)
├── offline.html                     # Offline fallback
├── icons/
│   ├── icon-72x72.png
│   ├── icon-96x96.png
│   ├── icon-128x128.png
│   ├── icon-144x144.png
│   ├── icon-152x152.png
│   ├── icon-192x192.png
│   ├── icon-384x384.png
│   └── icon-512x512.png
└── screenshots/
    ├── desktop-1.png                # For app stores
    └── mobile-1.png

src/
├── hooks/
│   └── use-pwa-install.ts           # Custom install prompt hook
├── components/
│   └── pwa-install-prompt.tsx       # Install banner (Aura Elite)
└── utils/
    └── pwa-utils.ts                 # PWA helpers
```

## Implementation Steps

### Step 1: Enhance PWA Manifest

**File:** `public/manifest.json`

```json
{
  "name": "WellNexus - Distributor Portal",
  "short_name": "WellNexus",
  "description": "Premium health product distribution platform with multi-level commission system",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0f",
  "theme_color": "#6366f1",
  "orientation": "portrait-primary",

  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],

  "screenshots": [
    {
      "src": "/screenshots/desktop-1.png",
      "sizes": "1920x1080",
      "type": "image/png",
      "form_factor": "wide",
      "label": "Dashboard overview"
    },
    {
      "src": "/screenshots/mobile-1.png",
      "sizes": "750x1334",
      "type": "image/png",
      "form_factor": "narrow",
      "label": "Mobile dashboard"
    }
  ],

  "shortcuts": [
    {
      "name": "View Orders",
      "short_name": "Orders",
      "description": "View your recent orders",
      "url": "/orders",
      "icons": [{ "src": "/icons/shortcut-orders.png", "sizes": "96x96" }]
    },
    {
      "name": "Scan QR",
      "short_name": "Scan",
      "description": "Scan product QR code",
      "url": "/scan",
      "icons": [{ "src": "/icons/shortcut-scan.png", "sizes": "96x96" }]
    },
    {
      "name": "Commission",
      "short_name": "Commission",
      "description": "View commission earnings",
      "url": "/commission",
      "icons": [{ "src": "/icons/shortcut-commission.png", "sizes": "96x96" }]
    }
  ],

  "categories": ["business", "productivity", "health"],
  "iarc_rating_id": "e84b072d-71b3-4d3e-86ae-31a8ce4e53b7",

  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}
```

### Step 2: Create Offline Fallback Page (Aura Elite Design)

**File:** `public/offline.html`

```html
<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WellNexus - Offline</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%);
      color: #e0e0e0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .offline-container {
      text-align: center;
      max-width: 500px;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 24px;
      padding: 60px 40px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    .icon {
      font-size: 80px;
      margin-bottom: 24px;
      opacity: 0.8;
    }

    h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    p {
      font-size: 16px;
      line-height: 1.6;
      color: #a0a0a0;
      margin-bottom: 32px;
    }

    .retry-btn {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: white;
      border: none;
      padding: 16px 32px;
      font-size: 16px;
      font-weight: 600;
      border-radius: 12px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .retry-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(99, 102, 241, 0.4);
    }

    .retry-btn:active {
      transform: translateY(0);
    }
  </style>
</head>
<body>
  <div class="offline-container">
    <div class="icon">📡</div>
    <h1>Bạn đang offline</h1>
    <p>
      Không thể kết nối đến WellNexus. Vui lòng kiểm tra kết nối internet và thử lại.
    </p>
    <button class="retry-btn" onclick="window.location.reload()">
      Thử lại
    </button>
  </div>
</body>
</html>
```

### Step 3: Implement Service Worker with Workbox

**File:** `vite.config.ts` (add PWA plugin)

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],

      manifest: false, // Use public/manifest.json directly

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 365 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],

        navigateFallback: '/offline.html',
        navigateFallbackDenylist: [/^\/api/],
      },

      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
});
```

### Step 4: Create PWA Install Hook

**File:** `src/hooks/use-pwa-install.ts`

```typescript
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function usePWAInstall() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Check if app was installed
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstallable(false);
      setInstallPrompt(null);
    }
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
  };
}
```

### Step 5: Create Install Prompt Component (Aura Elite)

**File:** `src/components/pwa-install-prompt.tsx`

```typescript
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePWAInstall } from '@/hooks/use-pwa-install';
import { useTranslation } from 'react-i18next';

export function PWAInstallPrompt() {
  const { t } = useTranslation();
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState(false);
  const [pageViews, setPageViews] = useState(0);

  useEffect(() => {
    // Track page views
    const views = parseInt(localStorage.getItem('pwa-page-views') || '0');
    const newViews = views + 1;
    setPageViews(newViews);
    localStorage.setItem('pwa-page-views', newViews.toString());

    // Check if previously dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) setIsDismissed(true);
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  const handleInstall = async () => {
    await promptInstall();
    handleDismiss();
  };

  // Show after 2 page views, not installed, not dismissed
  const shouldShow = isInstallable && !isInstalled && !isDismissed && pageViews >= 2;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50"
        >
          <div className="glass-panel p-6 rounded-2xl border border-white/10 shadow-2xl">
            <div className="flex items-start gap-4">
              <div className="text-4xl">📱</div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('pwa.install.title')}
                </h3>
                <p className="text-sm text-gray-300 mb-4">
                  {t('pwa.install.description')}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="btn-primary px-4 py-2 text-sm font-medium rounded-lg
                             bg-gradient-to-r from-indigo-500 to-purple-500
                             hover:from-indigo-600 hover:to-purple-600
                             transition-all"
                  >
                    {t('pwa.install.install')}
                  </button>

                  <button
                    onClick={handleDismiss}
                    className="px-4 py-2 text-sm font-medium text-gray-400
                             hover:text-white transition-colors"
                  >
                    {t('pwa.install.dismiss')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

### Step 6: Add PWA Translation Keys

**File:** `src/locales/vi.ts` (add PWA keys)

```typescript
export default {
  // ... existing keys

  pwa: {
    install: {
      title: 'Cài đặt WellNexus',
      description: 'Truy cập nhanh hơn với ứng dụng trên màn hình chính',
      install: 'Cài đặt ngay',
      dismiss: 'Để sau',
    },
    offline: {
      title: 'Bạn đang offline',
      message: 'Không thể kết nối đến WellNexus',
      retry: 'Thử lại',
    },
    update: {
      title: 'Cập nhật mới',
      message: 'Phiên bản mới đã sẵn sàng',
      reload: 'Tải lại',
    },
  },
};
```

**File:** `src/locales/en.ts`

```typescript
export default {
  // ... existing keys

  pwa: {
    install: {
      title: 'Install WellNexus',
      description: 'Get faster access with app on home screen',
      install: 'Install Now',
      dismiss: 'Later',
    },
    offline: {
      title: 'You are offline',
      message: 'Cannot connect to WellNexus',
      retry: 'Retry',
    },
    update: {
      title: 'New Update',
      message: 'A new version is available',
      reload: 'Reload',
    },
  },
};
```

### Step 7: Add PWA Install Prompt to App

**File:** `src/App.tsx` (add component)

```typescript
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';

function App() {
  return (
    <>
      <Router>
        {/* ... existing routes */}
      </Router>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
}
```

### Step 8: Generate PWA Icons

**Script:** `scripts/generate-pwa-icons.sh`

```bash
#!/bin/bash

# Requires ImageMagick: brew install imagemagick

SOURCE_ICON="src/assets/icon.svg"
OUTPUT_DIR="public/icons"

mkdir -p $OUTPUT_DIR

SIZES=(72 96 128 144 152 192 384 512)

for size in "${SIZES[@]}"; do
  convert $SOURCE_ICON \
    -resize ${size}x${size} \
    -background none \
    $OUTPUT_DIR/icon-${size}x${size}.png

  echo "✅ Generated icon-${size}x${size}.png"
done

echo "✅ All PWA icons generated"
```

### Step 9: Add iOS Meta Tags

**File:** `index.html` (add meta tags)

```html
<head>
  <!-- ... existing meta tags -->

  <!-- iOS PWA Support -->
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="WellNexus">

  <link rel="apple-touch-icon" href="/icons/icon-152x152.png">
  <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180x180.png">

  <!-- iOS Splash Screens -->
  <link rel="apple-touch-startup-image" href="/splash/iphone5.png" media="(device-width: 320px) and (device-height: 568px)">
  <link rel="apple-touch-startup-image" href="/splash/iphone6.png" media="(device-width: 375px) and (device-height: 667px)">
  <link rel="apple-touch-startup-image" href="/splash/iphonex.png" media="(device-width: 375px) and (device-height: 812px)">
  <link rel="apple-touch-startup-image" href="/splash/ipad.png" media="(device-width: 768px) and (device-height: 1024px)">
</head>
```

### Step 10: Add PWA Update Handler

**File:** `src/hooks/use-pwa-update.ts`

```typescript
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

export function usePWAUpdate() {
  const [needRefresh, setNeedRefresh] = useState(false);

  const {
    updateServiceWorker,
  } = useRegisterSW({
    onNeedRefresh() {
      setNeedRefresh(true);
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  return {
    needRefresh,
    handleUpdate,
  };
}
```

## Verification & Success Criteria

### Lighthouse Audit

```bash
# Build production
npm run build
npm run preview

# Run Lighthouse (Chrome DevTools)
# Performance: 90+
# PWA: 90+
# Accessibility: 90+
# Best Practices: 90+
# SEO: 90+
```

### Manual Testing

1. **Install Test (Desktop):**
   - Open Chrome/Edge
   - Click install icon in address bar
   - Verify app installs and opens in standalone window
   - Check shortcuts work

2. **Install Test (Mobile):**
   - iOS: Add to Home Screen from Safari
   - Android: "Add to Home Screen" from Chrome
   - Verify splash screen shows on launch

3. **Offline Test:**
   - Enable "Offline" in Chrome DevTools Network tab
   - Navigate to different pages
   - Verify offline.html shows for uncached pages
   - Cached pages should load normally

4. **Cache Test:**
   ```javascript
   // In browser console
   caches.keys().then(console.log)
   // Expected: ['workbox-precache-v2-...', 'workbox-runtime-...']
   ```

5. **Update Test:**
   - Make code change
   - Build and deploy
   - Reload page
   - Verify update prompt appears

### Success Criteria Checklist

- [ ] Lighthouse PWA score 90+
- [ ] Manifest.json valid (no errors in DevTools)
- [ ] Service worker registers successfully
- [ ] Install prompt shows after 2 page views
- [ ] App installs on Chrome/Edge desktop
- [ ] App installs on iOS Safari (Add to Home Screen)
- [ ] App installs on Android Chrome
- [ ] Offline fallback page displays correctly
- [ ] App shortcuts functional
- [ ] Splash screens display on iOS/Android
- [ ] Cache size < 10MB
- [ ] Update prompt triggers on new deployment
- [ ] All PWA icons generated (8 sizes)
- [ ] iOS meta tags present
- [ ] Service worker cache strategy working

## Rollback Plan

1. **Disable PWA plugin:**
   ```typescript
   // vite.config.ts
   // Comment out VitePWA plugin
   ```

2. **Unregister service worker:**
   ```typescript
   // src/main.tsx
   navigator.serviceWorker.getRegistrations().then(registrations => {
     registrations.forEach(registration => registration.unregister());
   });
   ```

3. **Revert changes:**
   ```bash
   git revert HEAD
   git push origin main
   ```

## Next Steps

After Phase 3 completion:
- Proceed to Phase 4 (SEO Optimization)
- Monitor PWA install metrics in analytics
- Consider push notification implementation
- Test on multiple devices and browsers

---

**Estimated Effort:** 2 hours
**Dependencies:** vite-plugin-pwa, workbox, ImageMagick (for icon generation)
**Risk Level:** Low (PWA is progressive enhancement, doesn't break existing functionality)
