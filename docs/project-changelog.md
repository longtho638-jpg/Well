# Project Changelog

## [Unreleased]

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
- **UI:** Fixed spin loader text in Agent Dashboard.
- **Type Safety:** Ensured `AgencyOSAgent` properly implements the `AgentDefinition` interface.
- **Localization:** Fixed missing/legacy translation keys in `PolicyEngine.tsx`.
