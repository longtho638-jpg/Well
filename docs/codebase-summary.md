# Codebase Summary

**Last Updated:** 2026-01-30
**Version:** v1.0.0-seed (Phase 2 Growth Features)

## Project Structure

The repository contains two distinct applications:

### 1. Distributor Portal (Root)
Located in the root directory, this is the main application for distributors.
- **Tech Stack:** React, Zustand, Firebase, Gemini.
- **Key Path:** `src/`

#### Core Directories
- `src/components/`: Reusable UI components
- `src/pages/`: Route-level components
- `src/store.ts`: Central Zustand store
- `src/services/`: External integrations (Gemini, Firebase)

### 2. Admin Panel
Located in `admin-panel/`, this is the internal management dashboard.
- **Tech Stack:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Recharts.
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
- **Agent System:** Agent Registry, Sales Copilot.

### Admin Panel
- **Dashboard Analytics:** Real-time metrics using Recharts.
- **Distributor Management:** Detailed profiles, team structures, and performance tracking.
- **Order Management:** Order processing, status updates, and history.
- **Customer Management:** End-user CRM and activity logs.

## Recent Implementation: Founder Admin Panel & Distributor Portal Optimization

### 1. Founder Admin Panel (v1.0)
Deployed a standalone "Headless" admin dashboard at `/admin` for high-performance management.
- **Architecture:** React 19, Vite, TanStack Query, Tailwind CSS.
- **Modules:**
  - **User/Distributor Management:** Virtualized tables for mass data handling.
  - **Orders & Customers:** specialized CRM and transaction workflows.
  - **Analytics:** Real-time revenue and growth charts.
- **Design:** Aura Elite (Glassmorphism) design system.

### 2. Distributor Portal Optimization
Completed 6-phase optimization plan focusing on user experience and sales efficiency.

- **Commission Widget:**
   - Real-time calculations
   - Trend indicators
   - Responsive design (1-3 cols)

- **Quick Purchase Modal:**
   - Fast access via Floating Action Button (FAB)
   - "Recent" and "Favorites" tabs
   - Express checkout flow

- **Internationalization:**
   - Added `dashboard.commission.*` keys
   - Added `marketplace.quickBuy.*` keys

### 3. Tech Debt Elimination
Focused effort to improve type safety and maintainability.
- **Type Safety:** Eliminated 31 instances of `: any` types across Test files, Hooks, Services, and Components.
- **Coverage:** Aligned types for `react-router-dom` mocks and `vitest` implementations to ensure strict type compliance.

## Testing
- **Framework:** Vitest + React Testing Library
- **Coverage:** Core utilities, Admin Panel modules, and new Distributor components.
- **Status:** 100% Pass Rate (Total tests passing)

## Technology Stack
- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Framer Motion
- **State:** Zustand
- **Backend:** Firebase (Auth/Firestore), Google Gemini (AI)
