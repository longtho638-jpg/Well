# Phase 4: i18n & PWA Completion

## Context Links
- [Plan Overview](./plan.md)
- [Phase 3: Admin Dashboard](./phase-03-admin-dashboard.md)
- [Code Standards - i18n](../../docs/code-standards.md#internationalization-i18n)
- [i18n Locale Files](../../src/locales/)

## Overview

**Priority:** P2 Medium
**Status:** ⏳ Pending (Can start after Phase 3)
**Effort:** 4 hours
**Dependencies:** Phase 3 (admin pages need i18n keys)

Complete internationalization with full English translations and fix all missing keys, then enable PWA with offline support and install prompts.

## Key Insights

1. **Current i18n State**: Vietnamese primary, English partial (many missing keys)
2. **Common Issues**: Hardcoded strings, duplicate keys, path mismatches (e.g., `metropolis` vs `empire`)
3. **PWA Status**: VitePWA plugin configured but not fully enabled
4. **Offline Strategy**: Cache-first for static assets, network-first for API calls
5. **Install Prompts**: Need to implement beforeinstallprompt handling

## Requirements

### i18n Requirements
- FR1: All user-facing strings must use t() function (0 hardcoded strings)
- FR2: Complete en.ts with all keys matching vi.ts structure
- FR3: Translation key paths must match exactly between code and locale files
- FR4: Build-time validation must catch missing/duplicate keys
- FR5: Language switcher must work on all pages

### PWA Requirements
- FR6: PWA manifest with all required icons (192x192, 512x512)
- FR7: Service worker with offline support
- FR8: Install prompt UI component
- FR9: Offline fallback page for network failures
- FR10: Update notification when new version available

### Non-Functional Requirements
- NFR1: i18n validation must run in CI/CD pipeline
- NFR2: Service worker must cache static assets aggressively
- NFR3: PWA install prompt must respect user dismissal
- NFR4: Offline page must maintain Aura Elite design
- NFR5: Language switch must be instant (no page reload)

## Architecture

### i18n Architecture
```
User Interaction → t('key.path') → i18next → Locale Files (en.ts/vi.ts) → Rendered Text
                                       ↓
                               Fallback to key if missing
```

### PWA Architecture
```
User Request → Service Worker → Cache Check
                    ↓                ↓
              Network Request    Cache Hit
                    ↓                ↓
              Cache Update    Return Cached
```

## Related Code Files

### Files to Audit/Modify
- `src/locales/en.ts` - Complete English translations
- `src/locales/vi.ts` - Verify all keys exist
- `src/components/LanguageSwitcher.tsx` - Enhance UI
- `vite.config.ts` - Enable VitePWA plugin
- `public/manifest.json` - PWA manifest configuration
- All `src/pages/*.tsx` - Fix hardcoded strings
- All `src/components/**/*.tsx` - Fix hardcoded strings

### Files to Create
- `scripts/validate-i18n-keys.ts` - Automated key validation
- `scripts/find-hardcoded-strings.ts` - Detect untranslated text
- `public/sw.ts` - Custom service worker
- `src/components/pwa-install-prompt.tsx` - Install UI
- `src/pages/offline.tsx` - Offline fallback page
- `public/icons/` - PWA icon set (192, 512, maskable)

### Files to Reference
- `src/i18n.ts` - i18next configuration

## Implementation Steps

### Step 1: i18n Validation & Cleanup (1.5h)

1. **Create validation script**:
   ```typescript
   // scripts/validate-i18n-keys.ts
   import en from '../src/locales/en';
   import vi from '../src/locales/vi';

   function flattenKeys(obj: any, prefix = ''): string[] {
     return Object.keys(obj).reduce((acc, key) => {
       const fullKey = prefix ? `${prefix}.${key}` : key;
       if (typeof obj[key] === 'object') {
         return [...acc, ...flattenKeys(obj[key], fullKey)];
       }
       return [...acc, fullKey];
     }, [] as string[]);
   }

   const enKeys = flattenKeys(en);
   const viKeys = flattenKeys(vi);

   // Check missing keys
   const missingInEn = viKeys.filter(k => !enKeys.includes(k));
   const missingInVi = enKeys.filter(k => !viKeys.includes(k));

   if (missingInEn.length > 0) {
     console.error('❌ Missing in en.ts:', missingInEn);
     process.exit(1);
   }

   if (missingInVi.length > 0) {
     console.error('❌ Missing in vi.ts:', missingInVi);
     process.exit(1);
   }

   console.log('✅ All translation keys match!');
   ```

2. **Find hardcoded strings**:
   ```typescript
   // scripts/find-hardcoded-strings.ts
   import { execSync } from 'child_process';

   // Grep for JSX text not using t()
   const result = execSync(
     `grep -rn '>[A-Z][a-zA-Z ]*<' src/ --include="*.tsx" --include="*.jsx" | grep -v "t('"`,
     { encoding: 'utf-8' }
   );

   if (result) {
     console.error('❌ Found hardcoded strings:', result);
     process.exit(1);
   }

   console.log('✅ No hardcoded strings found!');
   ```

3. **Run validation and fix issues**:
   ```bash
   tsx scripts/validate-i18n-keys.ts
   tsx scripts/find-hardcoded-strings.ts

   # Fix any issues found, then re-run
   ```

4. **Complete en.ts translations**:
   ```typescript
   // src/locales/en.ts
   export default {
     landing: {
       roadmap: {
         stages: {
           // FIX: Match vi.ts structure exactly
           village: { name: 'Village', description: '...' },
           town: { name: 'Town', description: '...' },
           city: { name: 'City', description: '...' },
           empire: { name: 'Empire', description: '...' }, // Not "metropolis"
         },
       },
     },
     // ... complete all sections
   };
   ```

5. **Add to package.json**:
   ```json
   {
     "scripts": {
       "validate:i18n": "tsx scripts/validate-i18n-keys.ts && tsx scripts/find-hardcoded-strings.ts"
     }
   }
   ```

### Step 2: Fix Missing Translation Keys (1h)

1. **Grep all t() calls**:
   ```bash
   grep -roh "t('[^']*')" src/ | sort -u > /tmp/used-keys.txt
   ```

2. **Compare with locale files**:
   ```bash
   # For each key in /tmp/used-keys.txt, check if exists in en.ts and vi.ts
   while read key; do
     if ! grep -q "$key" src/locales/en.ts; then
       echo "Missing in en.ts: $key"
     fi
   done < /tmp/used-keys.txt
   ```

3. **Add missing keys**:
   ```typescript
   // Add to both en.ts and vi.ts
   admin: {
     stats: {
       totalUsers: 'Total Users', // en.ts
       totalUsers: 'Tổng người dùng', // vi.ts
     },
   },
   ```

4. **Fix key path mismatches**:
   ```typescript
   // Code uses: t('landing.roadmap.stages.metropolis.name')
   // But vi.ts has: landing.roadmap.stages.empire.name

   // FIX: Update code to use correct path
   t('landing.roadmap.stages.empire.name')
   ```

### Step 3: Enable PWA with Service Worker (1h)

1. **Configure VitePWA**:
   ```typescript
   // vite.config.ts
   import { VitePWA } from 'vite-plugin-pwa';

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         includeAssets: ['favicon.ico', 'robots.txt', 'icons/*.png'],
         manifest: {
           name: 'WellNexus Distributor Portal',
           short_name: 'WellNexus',
           description: 'HealthFi Community Commerce Platform',
           theme_color: '#8B5CF6',
           background_color: '#0F172A',
           display: 'standalone',
           icons: [
             {
               src: '/icons/icon-192.png',
               sizes: '192x192',
               type: 'image/png',
             },
             {
               src: '/icons/icon-512.png',
               sizes: '512x512',
               type: 'image/png',
             },
             {
               src: '/icons/icon-maskable.png',
               sizes: '512x512',
               type: 'image/png',
               purpose: 'maskable',
             },
           ],
         },
         workbox: {
           globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
           runtimeCaching: [
             {
               urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
               handler: 'NetworkFirst',
               options: {
                 cacheName: 'supabase-cache',
                 expiration: {
                   maxEntries: 100,
                   maxAgeSeconds: 60 * 60 * 24, // 24 hours
                 },
               },
             },
             {
               urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
               handler: 'CacheFirst',
               options: {
                 cacheName: 'image-cache',
                 expiration: {
                   maxEntries: 200,
                   maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                 },
               },
             },
           ],
         },
       }),
     ],
   });
   ```

2. **Create PWA icons**:
   ```bash
   # Generate icons from source logo
   # Use ImageMagick or online tool
   convert logo.png -resize 192x192 public/icons/icon-192.png
   convert logo.png -resize 512x512 public/icons/icon-512.png
   ```

3. **Create offline page**:
   ```typescript
   // src/pages/offline.tsx
   import { AdminCard } from '@/components/aura-elite';

   export const OfflinePage: React.FC = () => {
     return (
       <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
         <AdminCard className="max-w-md text-center">
           <WifiOff className="w-16 h-16 mx-auto mb-4 text-purple-400" />
           <h1 className="text-2xl font-bold mb-2 text-white">
             {t('offline.title')}
           </h1>
           <p className="text-white/60 mb-4">
             {t('offline.description')}
           </p>
           <button
             onClick={() => window.location.reload()}
             className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700"
           >
             {t('offline.retry')}
           </button>
         </AdminCard>
       </div>
     );
   };
   ```

### Step 4: Implement Install Prompt (30min)

1. **Create install prompt component**:
   ```typescript
   // src/components/pwa-install-prompt.tsx
   import { useState, useEffect } from 'react';
   import { motion, AnimatePresence } from 'framer-motion';
   import { Download, X } from 'lucide-react';

   export const PWAInstallPrompt: React.FC = () => {
     const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
     const [showPrompt, setShowPrompt] = useState(false);

     useEffect(() => {
       const handler = (e: Event) => {
         e.preventDefault();
         setDeferredPrompt(e);

         // Check if user dismissed before
         const dismissed = localStorage.getItem('pwa-install-dismissed');
         if (!dismissed) {
           setShowPrompt(true);
         }
       };

       window.addEventListener('beforeinstallprompt', handler);
       return () => window.removeEventListener('beforeinstallprompt', handler);
     }, []);

     const handleInstall = async () => {
       if (!deferredPrompt) return;

       deferredPrompt.prompt();
       const { outcome } = await deferredPrompt.userChoice;

       if (outcome === 'accepted') {
         console.log('PWA installed');
       }

       setDeferredPrompt(null);
       setShowPrompt(false);
     };

     const handleDismiss = () => {
       setShowPrompt(false);
       localStorage.setItem('pwa-install-dismissed', 'true');
     };

     return (
       <AnimatePresence>
         {showPrompt && (
           <motion.div
             initial={{ y: 100, opacity: 0 }}
             animate={{ y: 0, opacity: 1 }}
             exit={{ y: 100, opacity: 0 }}
             className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-4 shadow-2xl z-50"
           >
             <button
               onClick={handleDismiss}
               className="absolute top-2 right-2 text-white/60 hover:text-white"
             >
               <X className="w-5 h-5" />
             </button>

             <div className="flex items-start gap-4">
               <Download className="w-8 h-8 text-purple-400 flex-shrink-0" />
               <div className="flex-1">
                 <h3 className="font-semibold text-white mb-1">
                   {t('pwa.install.title')}
                 </h3>
                 <p className="text-sm text-white/60 mb-3">
                   {t('pwa.install.description')}
                 </p>
                 <button
                   onClick={handleInstall}
                   className="px-4 py-2 bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
                 >
                   {t('pwa.install.button')}
                 </button>
               </div>
             </div>
           </motion.div>
         )}
       </AnimatePresence>
     );
   };
   ```

2. **Add to App.tsx**:
   ```typescript
   // src/App.tsx
   import { PWAInstallPrompt } from './components/pwa-install-prompt';

   function App() {
     return (
       <>
         <Router>
           {/* routes */}
         </Router>
         <PWAInstallPrompt />
       </>
     );
   }
   ```

## Todo List

### i18n Tasks
- [ ] Create scripts/validate-i18n-keys.ts
- [ ] Create scripts/find-hardcoded-strings.ts
- [ ] Run validation and capture all missing keys
- [ ] Complete en.ts with all translations
- [ ] Fix key path mismatches (metropolis → empire, etc.)
- [ ] Replace all hardcoded strings with t() calls
- [ ] Add validate:i18n to package.json scripts
- [ ] Add i18n validation to CI/CD pipeline
- [ ] Test language switcher on all pages
- [ ] Verify no console warnings about missing keys

### PWA Tasks
- [ ] Update vite.config.ts with VitePWA configuration
- [ ] Generate PWA icons (192x192, 512x512, maskable)
- [ ] Create public/manifest.json
- [ ] Create src/pages/offline.tsx
- [ ] Create src/components/pwa-install-prompt.tsx
- [ ] Add offline translations to en.ts and vi.ts
- [ ] Add pwa.install translations
- [ ] Test service worker caching strategy
- [ ] Test offline functionality
- [ ] Test install prompt on mobile devices

### Verification Tasks
- [ ] Verify build passes: `npm run build`
- [ ] Verify tests pass: `npm run test:run`
- [ ] Run `npm run validate:i18n` (must pass)
- [ ] Run Lighthouse PWA audit (score 90+)
- [ ] Test on iOS Safari and Android Chrome
- [ ] Verify service worker registers successfully
- [ ] Test offline mode with network disabled

## Success Criteria

### i18n Success Criteria
- [ ] 0 hardcoded strings in codebase
- [ ] en.ts and vi.ts have identical key structures
- [ ] All t() calls reference existing keys
- [ ] Language switcher works without page reload
- [ ] Build passes with 0 i18n validation errors
- [ ] No console warnings about missing translations

### PWA Success Criteria
- [ ] PWA installable on mobile (iOS + Android)
- [ ] PWA installable on desktop (Chrome, Edge, Safari)
- [ ] Install prompt appears and functions correctly
- [ ] Offline page renders when network unavailable
- [ ] Service worker caches static assets
- [ ] Lighthouse PWA score: 90+
- [ ] App works offline for cached routes

### Automated Verification
```bash
# All must pass:
npm run build                 # 0 TypeScript errors
npm run test:run              # 100% pass rate
npm run validate:i18n         # i18n validation
npm run lighthouse:pwa        # PWA audit score 90+
```

## Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Missing translation keys break UI | High | Medium | Automated validation in CI/CD |
| Service worker caches stale content | Medium | Low | Versioned cache names, manual cache clear |
| Install prompt dismissed permanently | Low | High | Allow re-trigger after 30 days |
| Offline page doesn't match design | Low | Low | Visual regression testing |
| i18n validation slows build | Low | Low | Run in parallel with tests |

## Security Considerations

### i18n Security
- **XSS Prevention**: Use t() with proper escaping, never dangerouslySetInnerHTML with user translations
- **Content Injection**: Validate translation files during build
- **Locale Switching**: Sanitize locale parameter to prevent path traversal

### PWA Security
- **Service Worker**: Validate all cached URLs, don't cache sensitive data
- **Offline Storage**: Don't cache authentication tokens or user PII
- **Update Strategy**: Force update on security patches

## Next Steps

After Phase 4 completion:

1. **Proceed to Phase 5**: SEO Optimization
2. **Monitoring**: Track PWA install rates and offline usage
3. **Translation Review**: Native speaker review of en.ts translations
4. **Performance**: Monitor service worker cache hit rates

---

**Phase Effort:** 4 hours
**Critical Path:** No (can be parallelized with Phase 5)
**Automation Level:** High (80% automated verification)
