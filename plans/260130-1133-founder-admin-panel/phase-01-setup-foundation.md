# Phase 1: Project Setup & Foundation

**Context Links:** [Plan Overview](./plan.md) | [Aura Elite UI Report](../reports/researcher-260130-1129-aura-elite-admin-ui.md)

## Overview
**Date:** 2026-01-30 | **Priority:** P1 | **Status:** Pending

Initialize the standalone admin application codebase. This phase establishes the "Aura Elite" visual foundation, directory structure, and core libraries required for the entire project.

## Key Insights
- **Headless UI:** Avoid heavy UI libraries (MUI/AntD). Use `Radix UI` primitives + Tailwind for custom glassmorphism.
- **Dark Mode Default:** The dashboard is "Aura Elite" (Dark/Glass) by default.
- **Performance First:** Configure Vite for optimized builds from day one.

## Requirements
- Initialize React + TypeScript + Vite project.
- Configure Tailwind CSS with "Aura Elite" design tokens (colors, gradients, glass effects).
- Install core dependencies: `zustand`, `@tanstack/react-query`, `lucide-react`, `clsx`, `tailwind-merge`.
- Set up project structure (`src/features`, `src/components/ui`, `src/layouts`).
- Create the base `AdminLayout` with Sidebar and Header components.

## Architecture
- **Directory Structure:** Feature-based architecture.
  ```
  src/
    components/ui/   # Reusable atoms (Button, Input, Card)
    layouts/         # AdminLayout, AuthLayout
    features/        # Domain logic (auth, users, orders)
    lib/             # Utilities (api, queryClient)
    stores/          # Global Zustand stores
  ```

## Implementation Steps
1.  **Initialize Project:** Create new Vite app `admin-panel`.
2.  **Tailwind Configuration:**
    -   Extend theme with Aura colors (`zinc-950`, `emerald-500`, `teal-500`, `amber-500`).
    -   Add utility classes for glassmorphism (`backdrop-blur-xl`, `bg-white/5`).
3.  **Install Dependencies:**
    -   `npm install zustand @tanstack/react-query react-router-dom lucide-react clsx tailwind-merge framer-motion`
    -   `npm install -D tailwindcss postcss autoprefixer`
4.  **Create UI Primitives:**
    -   `GlassCard`: Standard container with border and blur.
    -   `Button`: Primary (Gradient), Secondary (Glass), Ghost.
    -   `Input`: Glass style inputs.
5.  **Implement Layout:**
    -   `Sidebar`: Collapsible, glass effect, navigation links.
    -   `Header`: User profile, breadcrumbs, notifications.
    -   `AdminLayout`: Combines Sidebar and Header with `Outlet`.

## Todo List
- [x] Initialize Vite project
- [x] Configure Tailwind config with Aura tokens
- [x] Install core dependencies
- [x] Create `GlassCard`, `Button`, `Input` components
- [x] Implement `Sidebar` component
- [x] Implement `AdminLayout`
- [x] Verify build and dev server

## Success Criteria
- [x] Project builds without errors.
- [x] Tailwind classes for "glass" effects work.
- [x] Admin Layout renders with responsive Sidebar.

## Risk Assessment
- **Risk:** Design tokens mismatch with main app.
- **Mitigation:** Copy exact tokens from main app's `tailwind.config.js` or `design-tokens.ts`.

## Next Steps
- Proceed to Phase 2 (Authentication).
