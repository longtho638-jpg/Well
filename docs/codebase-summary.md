# Codebase Summary

**Last Updated:** 2026-02-02
**Version:** v2.1.2 (Infrastructure & Security Hardening)

## Project Structure

The repository contains two distinct applications:

### 1. Distributor Portal (Root)

Located in the root directory, this is the main application for distributors.

- **Tech Stack:** React 19, Vite 7, TypeScript 5.7+, Zustand, Firebase, Gemini.
- **Key Path:** `src/`

#### Core Directories

- `src/components/`: Reusable UI components
- `src/pages/`: Route-level components
- `src/store.ts`: Central Zustand store
- `src/services/`: External integrations (Gemini, Firebase)

### 2. Admin Panel

Located in `admin-panel/`, this is the internal management dashboard.

- **Tech Stack:** React 19, Vite 7, TypeScript 5.7+, Tailwind CSS, TanStack Query, Recharts.
- **Key Path:** `admin-panel/src/`

#### Core Directories

- `src/pages/`: Feature-based modules (Dashboard, Distributors, Orders, Customers).
- `src/services/`: API layers for business logic (DistributorService, OrderService).
- `src/stores/`: Auth state management.
- `src/components/ui/`: Shared UI components (Radix UI based).
- `src/layouts/`: Admin layout configuration.

## Key Components & Features

### Distributor Portal

- **Dashboard:** CommissionWidget, StatsGrid, HeroCard.
- **Marketplace:** QuickPurchaseModal, ProductGrid.
- **User Management:** SettingsPage, ProfilePage.
- **Authentication:** ForgotPage, ResetPasswordPage.
- **UI Components:** Select (dropdown), PasswordStrengthMeter.
- **Agent System:** Agent Registry, Sales Copilot.
- **SEO & Accessibility:** Meta tags, Sitemap, Robots.txt, ARIA roles.

### Admin Panel

- **Dashboard Analytics:** Real-time metrics using Recharts.
- **Distributor Management:** Detailed profiles, team structures, and performance tracking.
- **Order Management:** Order processing, status updates, and history.
- **Customer Management:** End-user CRM and activity logs.

## Recent Implementation: Binh Pháp Chương 13 (Modernization & SEO)

### 1. Tech Stack Upgrade

- **React 19:** Migrated both Distributor Portal and Admin Panel to React 19 for concurrent rendering features.
- **Vite 7:** Upgraded build tool for improved performance.
- **TypeScript 5.7+:** Enhanced type safety and strict mode compliance.

### 2. SEO & Accessibility Engine

- **SEO:**
  - Implemented `robots.txt` and `sitemap.xml`.
  - Added dynamic meta tags using `react-helmet-async` (or equivalent).
  - Added Open Graph images for social sharing.
- **Accessibility:**
  - Audit passed for WCAG 2.1 AA.
  - Improved keyboard navigation and ARIA labels in `VentureNavigation` and `NotificationCenter`.

### 3. Founder Admin Panel (v1.0)

Deployed a standalone "Headless" admin dashboard at `/admin` for high-performance management.

- **Architecture:** React 19, Vite, TanStack Query, Tailwind CSS.
- **Modules:**
  - **User/Distributor Management:** Virtualized tables for mass data handling.
  - **Orders & Customers:** specialized CRM and transaction workflows.
  - **Analytics:** Real-time revenue and growth charts.
- **Design:** Aura Elite (Glassmorphism) design system.

### 4. Distributor Portal Optimization

Completed 6-phase optimization plan focusing on user experience and sales efficiency.

- **Commission Widget:** Real-time calculations, Trend indicators.
- **Quick Purchase Modal:** FAB access, "Recent" and "Favorites" tabs.
- **Internationalization:** Added keys for dashboard and marketplace.

### 5. Tech Debt Elimination

Focused effort to improve type safety and maintainability.

- **Type Safety:** Eliminated 31 instances of `: any` types.
- **Coverage:** 100% strict type compliance.

### 6. Infrastructure & Security (New)

Implemented comprehensive production safeguards:

- **Error Tracking:** Sentry integration with 100% sample rate for production.
- **Security:** Content Security Policy (CSP), HSTS, and X-Content-Type-Options headers via `vercel.json`.
- **Auth Tokens:** Encrypted in-memory storage with sessionStorage fallback (mitigates XSS).
- **Password Validation:** NIST-compliant strength requirements with visual meter.
- **Admin Authorization:** Environment-based (VITE_ADMIN_EMAILS) replacing hardcoded arrays.
- **API Keys:** Zero fallbacks, strict environment variable validation.
- **Disaster Recovery:** RTO/RPO defined with recovery procedures for Database, Frontend, and Email.
- **Email:** DNS configuration guide for Resend (SPF/DKIM/DMARC).

### 7. Customer Bug Fixes & UX Improvements

Production-ready handover with all customer issues resolved:

- **i18n Consistency:** Synchronized Vietnamese/English translations across all pages.
- **Landing Page:** Removed duplicate text in hero section.
- **Login Flow:** Fixed translation key display issues.
- **Signup:** Added referral code field with backend integration.
- **Dashboard:** Personalized welcome message with user's name.
- **Withdrawal:** Bank dropdown selector (20+ Vietnamese banks).
- **User Settings:** New SettingsPage with theme, language, notifications, security preferences.
- **User Profile:** New ProfilePage for viewing and editing account information.

### 8. Authentication Enhancements (New)

- **Forgot Password Flow:** Full email-based password recovery implementation.
- **Secure Reset:** Token-based verification with NIST-compliant password validation.
- **UI Integration:** Dedicated pages for Forgot Password and Reset Password, integrated with Login flow.

## Testing

- **Framework:** Vitest + React Testing Library
- **Coverage:** Core utilities, Admin Panel modules, Distributor components, Security utilities.
- **Status:** 254/254 tests passing (100% pass rate)
- **Type Coverage:** 100% (0 :any types)

## Technology Stack

- **Frontend:** React 19, TypeScript 5.7+, Vite 7
- **Styling:** Tailwind CSS, Framer Motion
- **State:** Zustand
- **Backend:** Firebase (Auth/Firestore), Google Gemini (AI)
