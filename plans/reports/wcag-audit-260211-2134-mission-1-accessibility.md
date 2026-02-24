# WCAG 2.1 AA Accessibility Audit — Mission 1

**Date:** 2026-02-11 | **Scope:** 5 high-impact files | **Standard:** WCAG 2.1 Level AA

## Summary

| File | Violations Found | Fixed | Remaining |
|------|:---:|:---:|:---:|
| `src/pages/LandingPage.tsx` | 2 | 2 | 0 |
| `src/pages/Login.tsx` | 5 | 5 | 0 |
| `src/components/Sidebar.tsx` | 3 | 3 | 0 |
| `src/components/PremiumNavigation/MobileMenu.tsx` | 4 | 4 | 0 |
| `src/components/ui/Button.tsx` | 1 | 1 | 0 |
| **Total** | **15** | **15** | **0** |

## Detailed Violations & Fixes

### 1. LandingPage.tsx (2 violations)

| # | WCAG | Issue | Fix |
|---|------|-------|-----|
| 1 | 2.4.1 Bypass Blocks | No skip-to-content link for keyboard users | Added `<a href="#main-content">` skip link (sr-only, visible on focus) |
| 2 | 1.3.1 Info & Relationships | No `<main>` landmark — content wrapped in generic `<div>` | Wrapped content area in `<main id="main-content" role="main">` |

### 2. Login.tsx (5 violations)

| # | WCAG | Issue | Fix |
|---|------|-------|-----|
| 1 | 1.3.1 Info & Relationships | No `<main>` landmark | Changed root `<div>` to `<main>` with `aria-labelledby="login-heading"` |
| 2 | 1.1.1 Non-text Content | Logo link (W icon) had no accessible name | Added `aria-label={t('auth.login.backToHome')}` to Link |
| 3 | 4.1.3 Status Messages | Server error alert not announced to screen readers | Added `role="alert"` to error container, `aria-hidden` on icon |
| 4 | 1.1.1 Non-text Content | Password toggle button had no accessible name | Added `aria-label` toggling between `showPassword`/`hidePassword` |
| 5 | 1.1.1 Non-text Content | Eye/EyeOff icons not marked decorative | Added `aria-hidden="true"` to Eye/EyeOff icons |

### 3. Sidebar.tsx (3 violations)

| # | WCAG | Issue | Fix |
|---|------|-------|-----|
| 1 | 2.1.1 Keyboard | `onKeyPress` deprecated — fails for some keys in some browsers | Changed to `onKeyDown` |
| 2 | 1.3.1 Info & Relationships | Quest items not using semantic list elements | Changed `<div>` wrapper to `<ul>` with `aria-label`, quest items to `<li>` |
| 3 | 1.1.1 Non-text Content | CheckCircle2/Circle icons not marked decorative | Added `aria-hidden="true"` to quest status icons |

### 4. MobileMenu.tsx (4 violations)

| # | WCAG | Issue | Fix |
|---|------|-------|-----|
| 1 | 1.3.1 Info & Relationships | `<nav>` missing `aria-label` (indistinguishable from other navs) | Added `aria-label={t('premiumnavigation.mobileNavigation')}` |
| 2 | 1.1.1 Non-text Content | LayoutDashboard icon not marked decorative | Added `aria-hidden="true"` |
| 3 | 1.1.1 Non-text Content | LogOut icon not marked decorative | Added `aria-hidden="true"` |
| 4 | 1.1.1 Non-text Content | Zap icon not marked decorative | Added `aria-hidden="true"` |

### 5. Button.tsx (1 violation)

| # | WCAG | Issue | Fix |
|---|------|-------|-----|
| 1 | 1.1.1 Non-text Content | Loader2 spinner icon not marked decorative | Added `aria-hidden="true"` (text label "Loading" follows) |

## i18n Keys Added

| Key | vi.ts | en.ts |
|-----|-------|-------|
| `auth.login.backToHome` | "Về trang chủ WellNexus" | "Back to WellNexus home" |
| `auth.login.showPassword` | "Hiện mật khẩu" | "Show password" |
| `auth.login.hidePassword` | "Ẩn mật khẩu" | "Hide password" |
| `sidebar.questList` | "Danh sách nhiệm vụ" | "Quest list" |
| `sidebar.getAiAdviceLabel` | "Nhận tư vấn từ huấn luyện viên AI" | (already existed) |
| `premiumnavigation.mobileNavigation` | "Menu điều hướng di động" | "Mobile navigation menu" |

## Build Verification

- TypeScript: 0 errors
- i18n validation: 1424 keys — all present in vi.ts and en.ts
- Vite build: success (9.14s)

## Next Mission Candidates (Priority Order)

1. `src/pages/Signup.tsx` — form accessibility, field descriptions
2. `src/components/ProductCard.tsx` — image alt text, interactive card semantics
3. `src/components/ui/Modal.tsx` — focus trap, escape key, aria-modal
4. `src/components/PremiumNavigation/DesktopNav.tsx` — dropdown menu keyboard nav
5. `src/pages/Dashboard.tsx` — data visualization accessibility
