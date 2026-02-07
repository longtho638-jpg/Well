---
phase: 3
title: "i18n Completion + PWA Enablement"
priority: P2
status: pending
effort: 4h
dependencies: []
---

# Phase 3: i18n Completion + PWA Enablement

## Context Links

- **Code Standards**: `./docs/code-standards.md` (i18n section)
- **Current i18n Setup**: `./src/i18n.ts`
- **Vietnamese Locale**: `./src/locales/vi.ts`
- **PWA Config**: `./vite.config.ts` (VitePWA plugin)
- **Service Worker**: `./public/sw.ts`

---

## Overview

**Priority:** P2 - Medium
**Status:** ⏳ Pending
**Effort:** 4 hours

**Description:** Complete internationalization (i18n) infrastructure with English translations and enable PWA functionality for installable, offline-capable experience.

**Problem:**
- Missing English translation file (`en.ts`)
- Hardcoded strings throughout codebase
- Inconsistent translation key paths
- VitePWA plugin disabled in config
- Service worker not properly configured
- No offline fallback page

**Solution:**
- Create complete `en.ts` translation file
- Audit and fix all hardcoded strings
- Validate translation key consistency
- Enable VitePWA plugin with proper configuration
- Implement robust service worker with offline support
- Add PWA manifest for installation

---

## Key Insights

1. **i18n Foundation Exists**: React-i18next setup complete, just needs translations
2. **Critical Bug Pattern**: Key mismatches cause raw keys to display (production incident)
3. **PWA Quick Win**: VitePWA plugin already installed, just needs config
4. **Offline Strategy**: Cache-first for assets, network-first for API
5. **Installation Criteria**: Manifest + Service Worker + HTTPS = Installable

---

## Requirements

### Functional Requirements (i18n)
- English translation file mirrors Vietnamese structure
- Zero hardcoded strings in JSX
- Translation key validation script
- Language switcher component
- Fallback to English when key missing

### Functional Requirements (PWA)
- App installable on mobile and desktop
- Offline page when network unavailable
- Background sync for critical operations
- Push notifications (optional, future)
- Update prompt when new version available

### Non-Functional Requirements
- Translation files < 50KB each
- Service worker cache < 10MB
- Offline page loads instantly
- PWA audit score 100/100 (Lighthouse)
- i18n bundle size increase < 20KB

---

## Architecture

### i18n Architecture
```
┌─────────────────┐
│  Component      │
│  {t('key')}     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  i18next        │
│  Resolve key    │
└────────┬────────┘
         │
    ┌────┴─────┐
    ▼          ▼
┌─────────┐ ┌─────────┐
│  vi.ts  │ │  en.ts  │
└─────────┘ └─────────┘
```

### PWA Service Worker Strategy
```
Request Flow:
1. Asset Request (CSS/JS/Images)
   → Check Cache → Return if found
   → Fetch from Network → Cache → Return

2. API Request
   → Network First → Return
   → On Failure → Fallback to Cache

3. Offline
   → Return cached offline.html
```

---

## Related Code Files

### Files to Modify
- `src/i18n.ts` → Add English locale
- `src/App.tsx` → Add language switcher
- `vite.config.ts` → Enable VitePWA plugin
- `public/sw.ts` → Implement caching strategies
- `package.json` → Add i18n validation script

### Files to Create
- `src/locales/en.ts` (NEW - 800+ lines)
- `public/offline.html` (NEW)
- `scripts/validate-i18n-keys.ts` (NEW)
- `src/components/language-switcher.tsx` (NEW)

### Files to Delete
- None

---

## Implementation Steps

### Step 1: Create English Translation File (1.5h)
**File:** `src/locales/en.ts`

```typescript
/**
 * English Translation Dictionary for WellNexus
 * Must mirror vi.ts structure exactly to prevent key mismatches
 */

export const en = {
  // Common/Shared Text
  common: {
    loading: 'Loading...',
    error: 'An error occurred',
    success: 'Success',
    failed: 'Failed',
    save: 'Save',
    cancel: 'Cancel',
    close: 'Close',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    submit: 'Submit',
    search: 'Search',
    filter: 'Filter',
    copy: 'Copy',
    sort: 'Sort',
    viewAll: 'View All',
    viewDetails: 'View Details',
    notSupportedYet: 'Coming Soon',
    blocked: 'Blocked',
    currency: {
      vnd: '₫',
      grow: 'Token',
      shop: 'SHOP',
    },
    location: {
      vietnam: 'Vietnam',
    },
    rank: {
      daisu: 'Ambassador',
      ctv: 'Collaborator',
    }
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    network: 'Network',
    products: 'Products',
    partner: 'Partner',
    ventureDescription: 'Join 200+ Co-Founders',
    marketplace: 'Marketplace',
    wallet: 'Wallet',
    profile: 'Profile',
    logout: 'Logout',
  },

  // Authentication
  auth: {
    login: 'Login',
    signup: 'Sign Up',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    resetPassword: 'Reset Password',
    rememberMe: 'Remember Me',
    loginButton: 'Sign In',
    signupButton: 'Create Account',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    termsAgree: 'I agree to the Terms and Conditions',
    referralCode: 'Referral Code (Optional)',
    errors: {
      invalidEmail: 'Invalid email address',
      weakPassword: 'Password must be at least 8 characters',
      passwordMismatch: 'Passwords do not match',
      loginFailed: 'Login failed. Please check credentials.',
      emailTaken: 'Email already registered',
    },
  },

  // Dashboard
  dashboard: {
    welcome: 'Welcome back',
    stats: {
      revenue: 'Revenue',
      commission: 'Commission',
      teamSize: 'Team Size',
      activeOrders: 'Active Orders',
    },
    quickActions: {
      title: 'Quick Actions',
      newOrder: 'New Order',
      viewNetwork: 'View Network',
      withdraw: 'Withdraw Funds',
    },
  },

  // Marketplace/Products
  marketplace: {
    title: 'Marketplace',
    search: 'Search products...',
    filter: {
      all: 'All Products',
      featured: 'Featured',
      newArrivals: 'New Arrivals',
      onSale: 'On Sale',
    },
    product: {
      addToCart: 'Add to Cart',
      buyNow: 'Buy Now',
      outOfStock: 'Out of Stock',
      price: 'Price',
      stock: 'Stock',
      description: 'Description',
      specifications: 'Specifications',
    },
  },

  // Checkout
  checkout: {
    title: 'Checkout',
    cart: 'Shopping Cart',
    guestForm: {
      title: 'Guest Information',
      name: 'Full Name',
      email: 'Email Address',
      phone: 'Phone Number',
      namePlaceholder: 'Enter your full name',
      emailPlaceholder: 'your@email.com',
      phonePlaceholder: '0912345678',
    },
    payment: {
      title: 'Payment Method',
      selectMethod: 'Select payment method',
      bankTransfer: 'Bank Transfer',
      eWallet: 'E-Wallet',
      cod: 'Cash on Delivery',
    },
    summary: {
      title: 'Order Summary',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      tax: 'Tax',
      total: 'Total',
      placeOrder: 'Place Order',
    },
    errors: {
      emptyCart: 'Your cart is empty',
      invalidShipping: 'Please enter valid shipping information',
      paymentFailed: 'Payment failed. Please try again.',
    },
  },

  // Wallet
  wallet: {
    title: 'My Wallet',
    balance: {
      shop: 'SHOP Balance',
      grow: 'GROW Balance',
      total: 'Total Value',
    },
    actions: {
      deposit: 'Deposit',
      withdraw: 'Withdraw',
      transfer: 'Transfer',
      history: 'Transaction History',
    },
    withdrawal: {
      title: 'Withdraw Funds',
      amount: 'Amount',
      bankAccount: 'Bank Account',
      selectBank: 'Select Bank',
      accountNumber: 'Account Number',
      accountName: 'Account Name',
      minimumAmount: 'Minimum withdrawal: 100,000 VND',
      submit: 'Submit Request',
      errors: {
        insufficientBalance: 'Insufficient balance',
        belowMinimum: 'Amount below minimum',
        invalidAccount: 'Invalid bank account',
      },
    },
  },

  // Network/Team
  network: {
    title: 'My Network',
    stats: {
      totalMembers: 'Total Members',
      activeMembers: 'Active Members',
      newThisMonth: 'New This Month',
      teamVolume: 'Team Volume',
    },
    tree: {
      viewTree: 'View Tree',
      viewList: 'View List',
      expand: 'Expand All',
      collapse: 'Collapse All',
    },
    member: {
      name: 'Name',
      email: 'Email',
      rank: 'Rank',
      joined: 'Joined',
      sales: 'Sales',
      team: 'Team',
    },
  },

  // Withdrawal Flow
  withdrawal: {
    title: 'Withdrawal Request',
    status: {
      pending: 'Pending Review',
      approved: 'Approved',
      rejected: 'Rejected',
      processing: 'Processing',
      completed: 'Completed',
    },
    notifications: {
      submitted: 'Withdrawal request submitted successfully',
      approved: 'Your withdrawal has been approved',
      rejected: 'Your withdrawal was rejected',
      completed: 'Funds transferred to your account',
    },
  },

  // Landing Page (for WellNexus public site)
  landing: {
    hero: {
      title: 'Transform Your Health Journey',
      subtitle: 'Join Vietnam\'s leading health & wellness community',
      cta: 'Get Started',
    },
    features: {
      title: 'Why WellNexus?',
      community: {
        title: 'Strong Community',
        description: '200+ active distributors across Vietnam',
      },
      rewards: {
        title: 'Generous Rewards',
        description: 'Earn up to 25% commission on sales',
      },
      technology: {
        title: 'AI-Powered Tools',
        description: '24+ AI agents to boost your success',
      },
    },
    roadmap: {
      title: 'Our Journey',
      stages: {
        village: {
          name: 'Village',
          description: 'Foundation & Launch',
        },
        town: {
          name: 'Town',
          description: 'Growth & Expansion',
        },
        city: {
          name: 'City',
          description: 'Scale & Optimization',
        },
        metropolis: {
          name: 'Metropolis',
          description: 'Market Leadership',
        },
      },
    },
  },

  // Agent-OS (AI Agents)
  agents: {
    title: 'AI Agents',
    coach: {
      name: 'Sales Coach',
      description: 'Personalized sales training',
    },
    copilot: {
      name: 'Sales Copilot',
      description: 'Real-time sales assistance',
    },
    rewardEngine: {
      name: 'Reward Engine',
      description: 'Commission calculation',
    },
    // ... (add all 24 agents)
  },

  // Errors
  errors: {
    generic: 'Something went wrong',
    network: 'Network error. Please check your connection.',
    unauthorized: 'You are not authorized to perform this action',
    notFound: 'Page not found',
    serverError: 'Server error. Please try again later.',
  },
}
```

**Note:** This is a template. Full file requires translating ALL 800+ keys from `vi.ts`.

### Step 2: Create Translation Key Validation Script (30 min)
**File:** `scripts/validate-i18n-keys.ts`

```typescript
import { readFileSync } from 'fs'
import { join } from 'path'

interface TranslationObject {
  [key: string]: string | TranslationObject
}

function flattenKeys(obj: TranslationObject, prefix = ''): string[] {
  const keys: string[] = []
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'object') {
      keys.push(...flattenKeys(value, fullKey))
    } else {
      keys.push(fullKey)
    }
  }
  return keys
}

async function validateI18nKeys() {
  console.log('🔍 Validating i18n translation keys...\n')

  // Load translation files
  const viPath = join(process.cwd(), 'src/locales/vi.ts')
  const enPath = join(process.cwd(), 'src/locales/en.ts')

  let errors = 0

  try {
    // Import modules dynamically
    const { vi } = await import('../src/locales/vi')
    const { en } = await import('../src/locales/en')

    // Flatten keys
    const viKeys = new Set(flattenKeys(vi))
    const enKeys = new Set(flattenKeys(en))

    // Check for missing keys in English
    const missingInEn = [...viKeys].filter(key => !enKeys.has(key))
    if (missingInEn.length > 0) {
      console.error('❌ Keys missing in en.ts:')
      missingInEn.forEach(key => console.error(`   - ${key}`))
      errors += missingInEn.length
    }

    // Check for extra keys in English
    const extraInEn = [...enKeys].filter(key => !viKeys.has(key))
    if (extraInEn.length > 0) {
      console.error('❌ Extra keys in en.ts (not in vi.ts):')
      extraInEn.forEach(key => console.error(`   - ${key}`))
      errors += extraInEn.length
    }

    // Check for duplicate top-level keys
    const checkDuplicates = (obj: TranslationObject, file: string) => {
      const keys = Object.keys(obj)
      const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index)
      if (duplicates.length > 0) {
        console.error(`❌ Duplicate top-level keys in ${file}:`)
        duplicates.forEach(key => console.error(`   - ${key}`))
        errors += duplicates.length
      }
    }

    checkDuplicates(vi, 'vi.ts')
    checkDuplicates(en, 'en.ts')

    // Success
    if (errors === 0) {
      console.log('✅ All translation keys are valid!')
      console.log(`   Total keys: ${viKeys.size}`)
      process.exit(0)
    } else {
      console.error(`\n❌ Found ${errors} error(s)`)
      process.exit(1)
    }
  } catch (error) {
    console.error('❌ Failed to load translation files:', error)
    process.exit(1)
  }
}

validateI18nKeys()
```

**Add to `package.json`:**
```json
{
  "scripts": {
    "validate:i18n": "tsx scripts/validate-i18n-keys.ts"
  }
}
```

### Step 3: Audit and Fix Hardcoded Strings (1h)
```bash
# Find all potential hardcoded strings in JSX
grep -rn --include="*.tsx" --include="*.jsx" ">[A-Z][a-z]" src/ | grep -v "t(" > hardcoded-strings.txt

# Review and fix each instance
# Example fixes:
# Before: <button>Login</button>
# After:  <button>{t('auth.login')}</button>
```

**Common patterns to fix:**
- Button labels
- Page titles
- Error messages
- Form labels and placeholders
- Toast notifications
- Modal content

### Step 4: Enable VitePWA Plugin (45 min)
**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'WellNexus - Health & Wellness Platform',
        short_name: 'WellNexus',
        description: 'Vietnam\'s leading health & wellness community commerce platform',
        theme_color: '#9333ea', // purple-600
        background_color: '#0f172a', // slate-900
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'portrait-primary',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        categories: ['health', 'lifestyle', 'business'],
        shortcuts: [
          {
            name: 'Dashboard',
            url: '/dashboard',
            description: 'View your dashboard',
          },
          {
            name: 'Marketplace',
            url: '/marketplace',
            description: 'Browse products',
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
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 5, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
              },
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
      },
      devOptions: {
        enabled: true, // Enable in dev mode for testing
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### Step 5: Create Offline Fallback Page (15 min)
**File:** `public/offline.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - WellNexus</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .container {
      text-align: center;
      max-width: 500px;
      background: rgba(255, 255, 255, 0.1);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 24px;
      padding: 48px 32px;
      box-shadow: 0 20px 60px rgba(147, 51, 234, 0.3);
    }
    .icon {
      font-size: 64px;
      margin-bottom: 24px;
    }
    h1 {
      font-size: 32px;
      font-weight: bold;
      background: linear-gradient(to right, #a855f7, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 16px;
    }
    p {
      font-size: 18px;
      color: rgba(255, 255, 255, 0.8);
      margin-bottom: 32px;
      line-height: 1.6;
    }
    button {
      background: linear-gradient(to right, #9333ea, #ec4899);
      color: white;
      border: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 8px 24px rgba(147, 51, 234, 0.3);
      transition: transform 0.2s;
    }
    button:hover {
      transform: scale(1.05);
    }
    button:active {
      transform: scale(0.95);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">📡</div>
    <h1>You're Offline</h1>
    <p>It looks like you've lost your internet connection. Don't worry, you can still browse cached content!</p>
    <button onclick="window.location.reload()">Try Again</button>
  </div>
</body>
</html>
```

### Step 6: Create Language Switcher Component (30 min)
**File:** `src/components/language-switcher.tsx`

```typescript
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'
import { AURA_ELITE } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
]

export function LanguageSwitcher() {
  const { i18n } = useTranslation()

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    localStorage.setItem('language', langCode)
  }

  return (
    <div className="relative group">
      {/* Trigger Button */}
      <button
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-xl',
          AURA_ELITE.glass.medium,
          AURA_ELITE.borders.default,
          'hover:scale-105 transition-transform'
        )}
        aria-label="Change language"
      >
        <Globe className="w-5 h-5" />
        <span className="hidden sm:inline">
          {LANGUAGES.find(lang => lang.code === i18n.language)?.label || 'Language'}
        </span>
      </button>

      {/* Dropdown */}
      <div
        className={cn(
          'absolute right-0 mt-2 w-48 opacity-0 invisible',
          'group-hover:opacity-100 group-hover:visible',
          'transition-all duration-200',
          AURA_ELITE.glass.strong,
          AURA_ELITE.borders.glow,
          AURA_ELITE.spacing.card,
          AURA_ELITE.shadows.lg
        )}
      >
        {LANGUAGES.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg',
              'flex items-center gap-3',
              'hover:bg-white/10 transition-colors',
              i18n.language === lang.code && 'bg-purple-500/20'
            )}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className={AURA_ELITE.text.body}>{lang.label}</span>
            {i18n.language === lang.code && (
              <span className="ml-auto text-purple-400">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
```

### Step 7: Update i18n Config (15 min)
**File:** `src/i18n.ts`

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { vi } from './locales/vi'
import { en } from './locales/en'

const savedLanguage = localStorage.getItem('language') || 'vi'

i18n
  .use(initReactI18next)
  .init({
    resources: {
      vi: { translation: vi },
      en: { translation: en },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  })

export default i18n
```

### Step 8: Test and Verify (30 min)
```bash
# 1. Validate translation keys
npm run validate:i18n

# 2. Test language switching
npm run dev
# Switch between VI and EN, verify all text updates

# 3. Test PWA installation
npm run build
npm run preview
# Open Chrome DevTools > Application > Manifest
# Click "Install" button

# 4. Test offline mode
# Open DevTools > Network > Set to "Offline"
# Navigate around app, verify offline page shows

# 5. Run Lighthouse PWA audit
# DevTools > Lighthouse > PWA category
# Target: 100/100

# 6. Test on mobile device
# Deploy to Vercel preview
# Test installation on iOS Safari and Android Chrome
```

---

## Todo List

### i18n Tasks
- [ ] Create complete `en.ts` file (800+ keys)
- [ ] Run automated hardcoded string detection
- [ ] Fix all hardcoded strings with `t()` calls
- [ ] Create translation key validation script
- [ ] Add validation to pre-commit hook
- [ ] Create `LanguageSwitcher` component
- [ ] Update `i18n.ts` with English locale
- [ ] Test language switching (VI ↔ EN)
- [ ] Verify fallback to English for missing keys
- [ ] QA: Check all pages in both languages

### PWA Tasks
- [ ] Enable VitePWA plugin in `vite.config.ts`
- [ ] Configure PWA manifest (name, icons, theme)
- [ ] Create offline fallback page (`offline.html`)
- [ ] Generate PWA icons (192x192, 512x512)
- [ ] Configure service worker caching strategies
- [ ] Test installation on desktop (Chrome)
- [ ] Test installation on mobile (iOS + Android)
- [ ] Test offline functionality
- [ ] Run Lighthouse PWA audit (target 100/100)
- [ ] Test update prompt when new version deployed

---

## Success Criteria

### i18n
- ✅ `en.ts` file created with 100% key coverage
- ✅ Zero hardcoded strings in codebase (`grep` check passes)
- ✅ Translation key validation script passes
- ✅ Language switcher works smoothly (no page reload)
- ✅ All pages render correctly in English
- ✅ Fallback to English when Vietnamese key missing

### PWA
- ✅ App installable on desktop and mobile
- ✅ Install prompt appears after engagement criteria
- ✅ Offline page shows when network unavailable
- ✅ Cached assets load instantly offline
- ✅ Lighthouse PWA audit: 100/100
- ✅ Service worker caches < 10MB
- ✅ Update prompt appears when new version deployed

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Translation key mismatches | High | Medium | Automated validation script |
| Incomplete English translations | Medium | Medium | Review by native speaker |
| PWA cache too large | Medium | Low | Monitor cache size, set limits |
| Service worker breaks hot reload | Low | Medium | Use `devOptions.enabled` |
| iOS Safari PWA limitations | Medium | High | Test on real devices, document limitations |

---

## Security Considerations

1. **No Sensitive Data in Cache**: Exclude API responses with user data
2. **Cache Versioning**: Workbox handles automatic cache invalidation
3. **Offline Form Submissions**: Implement background sync (future)

---

## Next Steps

After Phase 3 completion:
1. Proceed to Phase 4 (Performance + SDK)
2. User testing with English-speaking users
3. Monitor i18n error logs for missing keys
4. Gather PWA installation metrics

---

**Phase Owner:** Frontend Team
**Reviewers:** Content Team (translations), QA Team (PWA testing)
**Target Completion:** Day 3
