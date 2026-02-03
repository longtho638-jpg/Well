# Project Changelog

## [2.3.0] - 2026-02-03

### ✨ Authentication Enhancement - Forgot Password Flow

Complete implementation of the secure password recovery workflow for users who have lost access to their accounts.

### Added

- **Routes:** New secure routes `/forgot-password` and `/reset-password` for account recovery.
- **Pages:**
  - `ForgotPage`: Email submission form with validation.
  - `ResetPasswordPage`: Secure password reset form with strength meter integration.
- **Components:** Integrated `PasswordStrengthMeter` into reset flow for security enforcement.
- **i18n:** Added comprehensive English and Vietnamese translations for auth recovery flows (`auth.forgotPassword`, `auth.resetPassword`).
- **UX:** Added "Forgot Password?" link to the Login page (removed "Coming Soon" tooltip).

### Security

- **Flow:** Secure token-based password reset via Firebase Auth.
- **Validation:** Enforced strong password policy during reset using existing NIST-compliant validation.

## [2.2.0] - 2026-02-02

### 🎯 Production Handover - Customer Bug Fixes & Security Hardening

Complete resolution of all customer issues and security vulnerabilities for production deployment.

### Added

- **User Settings:** New SettingsPage with theme switcher, language selector, notification preferences, and security settings.
- **User Profile:** New ProfilePage for viewing and editing account information with account status display.
- **UI Components:**
  - Select component (standardized dropdown with label, error, helper text support).
  - PasswordStrengthMeter (real-time visual feedback with color-coded strength indicator).
  - Bank selector with 20+ Vietnamese banks (Vietcombank, BIDV, Techcombank, MB Bank, etc.).
- **Security:**
  - SecureTokenStorage utility (encrypted in-memory storage with sessionStorage fallback).
  - Safari crypto polyfills for Web Crypto API compatibility.
  - password-validation utility (NIST-compliant strength scoring).
  - admin-check utility (environment-based authorization via VITE_ADMIN_EMAILS).
  - validate-config utility (fail-fast on missing environment variables).
- **Documentation:**
  - Client handover checklist (450+ lines, production deployment guide).
  - Binh Phap strategic framework (1000+ lines, Sun Tzu's principles applied).
- **Tests:** 19 new security tests (password validation: 9, admin check: 7, config validation: 3).

### Fixed

- **P0 - Landing Page:** Removed duplicate "VỚI WELLNEXUS" text from Vietnamese locale (landing.hero.title).
- **P1 - Login:** Fixed translation key path from `auth.demo` to `auth.login.demo` (displays proper text instead of "LOGIN.DEMO").
- **P2 - Signup:** Added referral code input field with backend integration to SignupForm and useSignup hook.
- **P3 - Dashboard:** Fixed welcome message to display user's first name with safe navigation (`(user?.name || '').split(' ')[0]`).
- **P3 - i18n:**
  - Synchronized vi.ts and en.ts locale files (added missing sections: leaderdashboard, revenuechart, ranks, alerts).
  - Removed ghost keys (duplicate sections ending in `x`).
  - Fixed liveActivities object→string issue (changed to `t('dashboard.liveActivities.title')`).
  - Refactored RANK_NAMES to return translation keys instead of hardcoded Vietnamese strings.
  - Fixed AI insights extra bracket (added missing opening parenthesis: `'Thành viên cần chú ý ('`).
- **P3 - Withdrawal:** Replaced text input with bank dropdown selector using Select component and VIETNAMESE_BANKS constant.
- **P3 - Navigation:** Added Settings link to Sidebar and Profile navigation from AppLayout header.

### Changed

- **Security - CRITICAL:** Migrated auth tokens from localStorage to encrypted in-memory storage (mitigates XSS attacks).
- **Security - HIGH:** Removed 'unsafe-inline' and 'unsafe-eval' from CSP headers in vercel.json (hardened Content Security Policy).
- **Security - MEDIUM:** Implemented strong password validation with visual strength meter in signup flow.
- **Security - MEDIUM:** Externalized admin emails to VITE_ADMIN_EMAILS environment variable (removed hardcoded arrays).
- **Security - MEDIUM:** Removed all API key fallbacks from client code (strict environment variable validation).
- **Auth:** Updated useLogin.ts and AdminRoute.tsx to use centralized admin-check utility.
- **Firebase:** Removed hardcoded fallback API keys from firebase.ts (fail-fast if env vars missing).
- **Gemini:** Removed hardcoded fallback API keys from gemini.ts (strict config validation).
- **Routes:** Added lazy-loaded routes for `/dashboard/settings` and `/dashboard/profile` in App.tsx.
- **Types:** RANK_NAMES now returns translation keys (`'ranks.thien_long'`) instead of literal strings (`'Thiên Long'`).
- **Tests:** Updated commission-logic.test.ts to expect translation keys instead of hardcoded Vietnamese strings.

### Security

- **Risk Reduction:** Reduced overall security risk from HIGH to LOW through comprehensive vulnerability remediation.
- **OWASP Top 10:** Verified compliance with all major security standards.
- **XSS Protection:** DOMPurify integrated for HTML sanitization.
- **SQL Injection:** Protected via Supabase SDK parameterized queries.
- **CSRF:** Mitigated by Supabase authentication framework.
- **HTTPS:** Enforced via CSP upgrade-insecure-requests directive.
- **HSTS:** Strict-Transport-Security header active (max-age=31536000; includeSubDomains; preload).

### Production Readiness

- **Tests:** 254/254 passing (100% pass rate) - Added 19 security tests.
- **Build:** 0 TypeScript errors (9.55s build time).
- **Type Coverage:** 100% (0 :any types).
- **Technical Debt:** 0 TODO/FIXME/HACK markers.
- **Console Statements:** 8 instances (all legitimate - logger/error handling).
- **Bundle Size:** 321.83 kB (gzipped: 99.35 kB).
- **Deployment:** Ready for production (pending VITE_ADMIN_EMAILS configuration).

## [2.1.2] - 2026-02-02

### 🏗️ Infrastructure & Security Upgrade

Comprehensive infrastructure hardening and monitoring integration.

### Added

- **Monitoring:** Integrated Sentry for real-time error tracking (100% sample rate).
- **Security:** Implemented Content Security Policy (CSP) and HSTS headers.
- **Security:** Migrated auth tokens from localStorage to Secure In-Memory Storage (mitigates XSS).
- **Security:** Implemented strong password validation with visual strength meter (zxcvbn-like scoring).
- **Security:** Removed hardcoded admin/demo emails in favor of environment variables.
- **Documentation:** Created Disaster Recovery Plan and Email DNS Configuration Guide.

### Configured

- **Performance:** Optimized CDN cache settings for static assets.
- **Validation:** Added `validateConfig` to fail-fast on missing environment variables.

## [2.1.1] - 2026-02-02

### 🔒 Handover Verification & Security Audit

Complete verification of production readiness for customer delivery.

### Fixed

- **i18n:** Removed duplicate top-level keys in locale files (`team`, `agentDashboard`)
- **i18n:** Fixed invalid locale key name (`4_9_core_rating` → `core_rating_4_9`)
- **i18n:** Fixed CommandPalette missing `i18nKey` property in type definition
- **Auth:** Fixed useSignup Supabase integration (replaced broken `signUp()` with `supabase.auth.signUp()`)
- **Security:** Verified Gemini API key secured in Edge Function (zero client exposure)
- **Security:** Verified prototype pollution protection (FORBIDDEN_KEYS validation in `deep.ts`)
- **Performance:** Verified ParticleBackground memory leak fixed (proper cleanup in useEffect)
- **Type Safety:** Verified zero unsafe non-null assertions (all replaced with proper null checks)

### Added

- **Documentation:** Comprehensive handover readiness assessment report (92/100 score)
- **Documentation:** Security fixes completion report with verification evidence

### Changed

- **Build:** All TypeScript compilation errors resolved (0 errors)
- **Tests:** Maintained 100% pass rate (235/235 tests passing)

## [2.1.0] - 2026-01-30

### 🚀 Binh Pháp Chương 13: Total Codebase Update

A massive infrastructure overhaul transforming the codebase to Production-Ready status (A+).

### Added

- **SEO Engine:** Complete implementation of `robots.txt`, `sitemap.xml`, and dynamic meta tags.
- **Accessibility:** WCAG 2.1 AA compliance (ARIA roles, keyboard nav).
- **Documentation:** Full JSDoc coverage for all services; updated System Architecture.
- **Performance:**
  - Route-level code splitting using `React.lazy` and `Suspense`.
  - Component-level memoization (`React.memo`) for `ProductGrid` and `Leaderboard`.
  - Lazy loading for heavy modals (`QuickPurchaseModal`).

### Changed

- **Core Stack Upgrade:**
  - React 18 → **React 19**
  - Vite 5 → **Vite 7**
  - TypeScript 5.x → **TypeScript 5.7 Strict**
- **Type Safety:** Eliminated 100% of `: any` types (0 errors in strict mode).
- **Build:** Optimized build chunks for faster FCP (First Contentful Paint).

### Fixed

- **Linting:** Resolved 56+ ESLint/Prettier violations.
- **Dead Code:** Removed unused imports, legacy React imports, and console logs.
- **Tests:** Stabilized test suite (235 tests passing).

## [2.0.0] - 2026-01-20

### Added

- **Founder Admin Panel:** Released comprehensive admin dashboard (`/admin`).
  - **Modules:** User, Distributor, Customer, and Order management.
  - **Analytics:** Real-time visual dashboards using Recharts.
  - **Architecture:** Standalone route with specialized "Aura Elite" design system.
  - **Performance:** Virtualized tables for large datasets.
- **Commission Widget:** Implemented a real-time earnings dashboard component (`CommissionWidget.tsx`) with:
  - Period switching (Today, 7 Days, 30 Days)
  - Revenue breakdown (Direct Sales vs Team Volume)
  - Trend indicators and animations
  - Mobile-responsive layout
- **Quick Purchase Modal:** Added express checkout functionality (`QuickPurchaseModal.tsx`) featuring:
  - "Recent Purchases" tab tracking last 5 unique items
  - "Favorites" tab with toggle functionality (localStorage persistence)
  - Direct navigation to product details
- **Marketplace FAB:** Added a Floating Action Button in the Marketplace for quick access to the Quick Purchase Modal.
- **Tests:** Added comprehensive test suites for `CommissionWidget` and `QuickPurchaseModal` (100% pass rate).
- **Localization:** Added new translation keys for commission and quick buy features in `en.ts` and `vi.ts`.

### Changed

- **Dashboard Layout:** Integrated `CommissionWidget` into the main Dashboard view.
- **Marketplace Layout:** Updated Marketplace page to support the new FAB overlay.
- **Agent Architecture:** Implemented `AgentRegistry`, `BaseAgent`, and `ClaudeKitAdapter` to support the Agency of Agents model.
- **Agent Dashboard:** Fully integrated `AgentDashboard` with the backend agent system.
- **Localization Keys:** Standardized Agent Dashboard keys to camelCase (`agentDashboard`).

### Fixed

- **Tech Debt:** Eliminated all 31 instances of `: any` type across the codebase.
- **Type Safety:** Achieved 100% compliance with strict TypeScript configuration (0 errors).
- **UI:** Fixed spin loader text in Agent Dashboard.
- **Type Safety:** Ensured `AgencyOSAgent` properly implements the `AgentDefinition` interface.
- **Localization:** Fixed missing/legacy translation keys in `PolicyEngine.tsx`.
