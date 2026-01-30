# Project Changelog

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
