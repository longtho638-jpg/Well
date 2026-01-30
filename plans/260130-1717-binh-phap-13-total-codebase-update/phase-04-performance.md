---
phase: 4
title: "Performance & Refactoring"
priority: P2
effort: 1 day
status: completed
---

# Phase 04: Performance & Refactoring

**Goal**: Optimize application performance, reduce bundle size, and ensure smooth 60fps animations.

**Scope**:
1.  Verify and enhance Code Splitting (Routes & Heavy Components).
2.  Implement `React.memo` and `useMemo` for expensive renders.
3.  Optimize images and assets.
4.  Audit bundle size and tree-shaking.
5.  Verify Lighthouse Core Web Vitals.

---

## Context Links

- **Main Plan**: `./plan.md`
- **Architecture**: `../../docs/system-architecture.md`

---

## Requirements

### Functional Requirements
- **FR4-1**: Initial load time (LCP) under 2.5s on mobile networks.
- **FR4-2**: Interaction to Next Paint (INP) under 200ms.
- **FR4-3**: Admin and Dashboard bundles must be separated.

### Non-Functional Requirements
- **NFR4-1**: No layout shifts (CLS < 0.1).
- **NFR4-2**: Smooth animations (no jank).

---

## Implementation Steps

### Step 1: Code Splitting Audit
1.  Review `App.tsx` route splitting.
2.  Identify heavy modals or drawers that can be lazy loaded.
3.  Split large utility libraries if possible.

### Step 2: Component Optimization
1.  Analyze re-renders in `Marketplace` and `Leaderboard`.
2.  Apply `React.memo` to `ProductCard`, `LeaderboardRow`.
3.  Memoize heavy calculations (e.g., filtering logic).

### Step 3: Bundle Optimization
1.  Run `npm run build` and analyze chunks.
2.  Verify tree-shaking for `lucide-react` and `framer-motion`.

### Step 4: Verification
1.  Run Lighthouse audit on local build.
2.  Verify user flows remain functional.

---

## Todo List

- [x] Audit `App.tsx` for complete route splitting
- [x] Lazy load `QuickPurchaseModal` and other heavy UI elements
- [x] Optimize `Marketplace` filtering logic with `useMemo`
- [x] Optimize `Leaderboard` list rendering
- [x] Run build analysis
- [x] Lighthouse Check

---

## Success Criteria

- ✅ Build chunks are properly split (vendor vs app).
- ✅ Lighthouse Performance Score > 90.
- ✅ No unnecessary re-renders in core flows.
