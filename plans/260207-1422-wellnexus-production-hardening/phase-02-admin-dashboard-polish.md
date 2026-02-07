---
phase: 2
title: "Admin Dashboard UI/UX Polish - Aura Elite Standardization"
priority: P1
status: pending
effort: 4h
dependencies: [phase-01]
---

# Phase 2: Admin Dashboard UI/UX Polish - Aura Elite Standardization

## Context Links

- **Design System**: `./DESIGN_SYSTEM.md` (Aura Elite guidelines)
- **Code Standards**: `./docs/code-standards.md` (UI/UX section)
- **Admin Panel Source**: `./admin-panel/src/`
- **Existing Components**: `./src/components/` (Aura Elite reference)

---

## Overview

**Priority:** P1 - High
**Status:** ⏳ Pending
**Effort:** 4 hours

**Description:** Standardize admin dashboard UI to match "Aura Elite" design system (Glassmorphism, dark gradients) and implement proper role-based route protection.

**Problem:**
- Admin panel uses inconsistent UI libraries (mix of custom + Radix UI)
- No visual cohesion with main distributor portal (Aura Elite style)
- Missing protected route guards with admin role verification
- Accessibility issues in custom components

**Solution:**
- Apply Aura Elite design tokens (glassmorphism, gradients, animations)
- Standardize on Radix UI primitives with Aura Elite styling
- Implement `ProtectedRoute` component with role checks
- Ensure WCAG 2.1 AA compliance

---

## Key Insights

1. **Design System Exists**: Main portal has complete Aura Elite component library
2. **Radix UI Foundation**: Already using Radix primitives, just needs styling
3. **Route Protection Gap**: No role validation on admin routes (security issue)
4. **Consistency = Trust**: Users expect same visual language across both apps

---

## Requirements

### Functional Requirements
- Admin routes redirect to login if unauthenticated
- Admin routes show "Forbidden" if user lacks admin role
- All admin components match Aura Elite visual style
- Keyboard navigation works on all interactive elements
- Screen reader announces all state changes

### Non-Functional Requirements
- Zero layout shift during route protection checks
- Glassmorphism effects maintain 60fps
- Color contrast meets WCAG AA (4.5:1 for text)
- Component library < 100KB additional bundle size
- Mobile responsive (320px to 4K)

---

## Architecture

### Aura Elite Design Tokens
```typescript
// Design System Constants
const AURA_ELITE = {
  colors: {
    primary: 'from-purple-600 via-pink-500 to-orange-400',
    glass: 'bg-white/10 backdrop-blur-xl',
    border: 'border border-white/20',
    shadow: 'shadow-2xl shadow-purple-500/20',
  },
  animations: {
    fadeIn: 'animate-fadeIn',
    slideUp: 'animate-slideUp',
    pulse: 'animate-pulse',
  },
  spacing: {
    card: 'p-6 rounded-2xl',
    section: 'space-y-6',
  },
}
```

### Protected Route Architecture
```
┌─────────────────┐
│  Admin Route    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  ProtectedRoute HOC     │
│  1. Check auth status   │
│  2. Check user role     │
│  3. Render or redirect  │
└────────┬────────────────┘
         │
    ┌────┴────┐
    │ Render? │
    └────┬────┘
         │
    ┌────┴────────────┐
    ▼                 ▼
┌─────────┐     ┌─────────┐
│ Admin   │     │ Redirect│
│ Content │     │ /login  │
└─────────┘     └─────────┘
```

---

## Related Code Files

### Files to Modify
- `admin-panel/src/App.tsx` → Wrap routes with `ProtectedRoute`
- `admin-panel/src/components/*.tsx` → Apply Aura Elite styling
- `admin-panel/src/pages/*.tsx` → Standardize layout structure
- `admin-panel/tailwind.config.ts` → Import Aura Elite tokens

### Files to Create
- `admin-panel/src/components/protected-route.tsx` (NEW)
- `admin-panel/src/components/ui/aura-card.tsx` (NEW)
- `admin-panel/src/components/ui/aura-button.tsx` (NEW)
- `admin-panel/src/lib/design-tokens.ts` (NEW)

### Files to Delete
- None (refactor in place)

---

## Implementation Steps

### Step 1: Create Design Tokens Library (30 min)
**File:** `admin-panel/src/lib/design-tokens.ts`

```typescript
/**
 * Aura Elite Design System Tokens
 * Shared constants for consistent UI across admin panel
 */

export const AURA_ELITE = {
  // Glassmorphism backgrounds
  glass: {
    light: 'bg-white/10 backdrop-blur-xl',
    medium: 'bg-white/20 backdrop-blur-2xl',
    strong: 'bg-white/30 backdrop-blur-3xl',
    dark: 'bg-black/20 backdrop-blur-xl',
  },

  // Gradient combinations
  gradients: {
    primary: 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400',
    secondary: 'bg-gradient-to-br from-blue-500 to-purple-600',
    success: 'bg-gradient-to-r from-green-400 to-emerald-500',
    warning: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600',
  },

  // Border styles
  borders: {
    default: 'border border-white/20',
    glow: 'border border-white/30 shadow-lg shadow-purple-500/20',
    strong: 'border-2 border-white/40',
  },

  // Shadow effects
  shadows: {
    sm: 'shadow-sm shadow-purple-500/10',
    md: 'shadow-lg shadow-purple-500/15',
    lg: 'shadow-2xl shadow-purple-500/25',
    glow: 'shadow-2xl shadow-purple-400/50',
  },

  // Animation classes
  animations: {
    fadeIn: 'animate-fadeIn',
    slideUp: 'animate-slideUp',
    slideDown: 'animate-slideDown',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
  },

  // Spacing presets
  spacing: {
    card: 'p-6 rounded-2xl',
    section: 'space-y-6',
    stack: 'space-y-4',
    inline: 'space-x-4',
  },

  // Typography
  text: {
    heading: 'text-3xl font-bold bg-clip-text text-transparent',
    subheading: 'text-xl font-semibold text-white/90',
    body: 'text-base text-white/80',
    caption: 'text-sm text-white/60',
  },
} as const

export type AuraTheme = typeof AURA_ELITE
```

### Step 2: Create ProtectedRoute Component (45 min)
**File:** `admin-panel/src/components/protected-route.tsx`

```typescript
import { ReactNode, useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Loader2 } from 'lucide-react'
import { AURA_ELITE } from '@/lib/design-tokens'

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: 'admin' | 'distributor'
  fallbackPath?: string
}

/**
 * Protected Route Component with Role-Based Access Control
 *
 * Features:
 * - Authentication check
 * - Role-based authorization
 * - Loading state (prevents flash of wrong content)
 * - Automatic redirect to login with return URL
 * - Forbidden page for insufficient permissions
 */
export function ProtectedRoute({
  children,
  requiredRole = 'admin',
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { user, loading, isAuthenticated } = useAuth()
  const location = useLocation()

  // Loading state - show skeleton with Aura Elite style
  if (loading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${AURA_ELITE.glass.dark}`}>
        <div className={`${AURA_ELITE.spacing.card} ${AURA_ELITE.glass.medium} ${AURA_ELITE.borders.glow}`}>
          <Loader2 className={`w-12 h-12 ${AURA_ELITE.animations.spin} text-purple-400`} />
          <p className={`mt-4 ${AURA_ELITE.text.body}`}>Verifying credentials...</p>
        </div>
      </div>
    )
  }

  // Not authenticated - redirect to login with return URL
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location.pathname }} replace />
  }

  // Authenticated but insufficient role - show forbidden page
  if (user?.role !== requiredRole) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${AURA_ELITE.glass.dark}`}>
        <div className={`${AURA_ELITE.spacing.card} ${AURA_ELITE.glass.medium} ${AURA_ELITE.borders.default} max-w-md text-center`}>
          <div className={`w-20 h-20 mx-auto mb-6 rounded-full ${AURA_ELITE.gradients.danger} flex items-center justify-center`}>
            <span className="text-4xl">🚫</span>
          </div>
          <h1 className={AURA_ELITE.text.heading + ' ' + AURA_ELITE.gradients.primary}>
            Access Forbidden
          </h1>
          <p className={`mt-4 ${AURA_ELITE.text.body}`}>
            You don't have permission to access this page.
          </p>
          <p className={`mt-2 ${AURA_ELITE.text.caption}`}>
            Required role: <strong>{requiredRole}</strong>
          </p>
          <p className={`mt-1 ${AURA_ELITE.text.caption}`}>
            Your role: <strong>{user?.role || 'unknown'}</strong>
          </p>
          <button
            onClick={() => window.history.back()}
            className={`mt-6 px-6 py-3 rounded-xl ${AURA_ELITE.gradients.primary} ${AURA_ELITE.shadows.md} hover:scale-105 transition-transform`}
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  // All checks passed - render children
  return <>{children}</>
}
```

### Step 3: Create Aura Elite Card Component (30 min)
**File:** `admin-panel/src/components/ui/aura-card.tsx`

```typescript
import { ReactNode } from 'react'
import { AURA_ELITE } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'

interface AuraCardProps {
  children: ReactNode
  variant?: 'glass' | 'solid' | 'gradient'
  glow?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Aura Elite Card Component
 * Glassmorphism card with optional gradient and glow effects
 */
export function AuraCard({
  children,
  variant = 'glass',
  glow = false,
  className,
  onClick,
}: AuraCardProps) {
  const baseStyles = cn(
    AURA_ELITE.spacing.card,
    'rounded-2xl transition-all duration-300',
    onClick && 'cursor-pointer hover:scale-[1.02]'
  )

  const variantStyles = {
    glass: cn(AURA_ELITE.glass.medium, AURA_ELITE.borders.default),
    solid: 'bg-gray-900/90 border border-white/10',
    gradient: cn(AURA_ELITE.gradients.primary, 'text-white'),
  }

  const shadowStyles = glow ? AURA_ELITE.shadows.glow : AURA_ELITE.shadows.md

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], shadowStyles, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  )
}
```

### Step 4: Create Aura Elite Button Component (30 min)
**File:** `admin-panel/src/components/ui/aura-button.tsx`

```typescript
import { ReactNode } from 'react'
import { AURA_ELITE } from '@/lib/design-tokens'
import { cn } from '@/lib/utils'
import { Loader2 } from 'lucide-react'

interface AuraButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export function AuraButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  onClick,
  type = 'button',
}: AuraButtonProps) {
  const baseStyles = cn(
    'rounded-xl font-semibold transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    !disabled && !loading && 'hover:scale-105 active:scale-95'
  )

  const variantStyles = {
    primary: cn(AURA_ELITE.gradients.primary, AURA_ELITE.shadows.md, 'text-white'),
    secondary: cn(AURA_ELITE.gradients.secondary, AURA_ELITE.shadows.md, 'text-white'),
    success: cn(AURA_ELITE.gradients.success, AURA_ELITE.shadows.sm, 'text-white'),
    danger: cn(AURA_ELITE.gradients.danger, AURA_ELITE.shadows.sm, 'text-white'),
    ghost: 'bg-transparent border border-white/20 text-white/80 hover:bg-white/10',
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      type={type}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  )
}
```

### Step 5: Update Admin Routes with Protection (30 min)
**File:** `admin-panel/src/App.tsx`

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardLayout } from '@/layouts/dashboard-layout'

// Pages
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { DistributorsPage } from '@/pages/distributors'
import { OrdersPage } from '@/pages/orders'
import { WithdrawalsPage } from '@/pages/withdrawals'
import { CustomersPage } from '@/pages/customers'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Protected admin routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute requiredRole="admin">
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="distributors" element={<DistributorsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="withdrawals" element={<WithdrawalsPage />} />
          <Route path="customers" element={<CustomersPage />} />
        </Route>

        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

### Step 6: Refactor Admin Components with Aura Elite (1h)
**Example:** `admin-panel/src/pages/withdrawals/WithdrawalsPage.tsx`

```typescript
import { AuraCard } from '@/components/ui/aura-card'
import { AuraButton } from '@/components/ui/aura-button'
import { AURA_ELITE } from '@/lib/design-tokens'
import { useWithdrawals } from '@/hooks/useWithdrawals'

export function WithdrawalsPage() {
  const { withdrawals, approveWithdrawal, rejectWithdrawal, loading } = useWithdrawals()

  return (
    <div className={`min-h-screen p-8 ${AURA_ELITE.glass.dark}`}>
      {/* Page Header */}
      <div className={AURA_ELITE.spacing.section}>
        <h1 className={cn(AURA_ELITE.text.heading, AURA_ELITE.gradients.primary)}>
          Withdrawal Requests
        </h1>
        <p className={AURA_ELITE.text.body}>
          Review and process distributor payout requests
        </p>
      </div>

      {/* Withdrawals List */}
      <div className="grid gap-6 mt-8">
        {withdrawals.map((withdrawal) => (
          <AuraCard key={withdrawal.id} glow={withdrawal.status === 'pending'}>
            <div className="flex items-center justify-between">
              {/* Left: User Info */}
              <div className={AURA_ELITE.spacing.stack}>
                <h3 className={AURA_ELITE.text.subheading}>
                  {withdrawal.user_name}
                </h3>
                <p className={AURA_ELITE.text.caption}>
                  {withdrawal.bank_name} - {withdrawal.account_number}
                </p>
              </div>

              {/* Center: Amount */}
              <div className="text-center">
                <p className={AURA_ELITE.text.caption}>Amount</p>
                <p className={cn(AURA_ELITE.text.heading, 'text-2xl')}>
                  {withdrawal.amount.toLocaleString('vi-VN')} đ
                </p>
              </div>

              {/* Right: Actions */}
              <div className={AURA_ELITE.spacing.inline}>
                <AuraButton
                  variant="success"
                  size="sm"
                  onClick={() => approveWithdrawal(withdrawal.id)}
                  loading={loading}
                >
                  Approve
                </AuraButton>
                <AuraButton
                  variant="danger"
                  size="sm"
                  onClick={() => rejectWithdrawal(withdrawal.id)}
                  loading={loading}
                >
                  Reject
                </AuraButton>
              </div>
            </div>
          </AuraCard>
        ))}
      </div>
    </div>
  )
}
```

### Step 7: Update Tailwind Config with Aura Animations (15 min)
**File:** `admin-panel/tailwind.config.ts`

```typescript
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        fadeIn: 'fadeIn 0.5s ease-in-out',
        slideUp: 'slideUp 0.5s ease-out',
        slideDown: 'slideDown 0.5s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
```

### Step 8: Accessibility Audit and Fixes (30 min)
```bash
# Run automated accessibility tests
npm run test:a11y

# Manual checks:
# 1. Keyboard navigation (Tab, Enter, Esc)
# 2. Screen reader announcements (VoiceOver/NVDA)
# 3. Color contrast (use browser DevTools)
# 4. Focus indicators visible
# 5. ARIA labels on interactive elements
```

**Common fixes:**
- Add `aria-label` to icon-only buttons
- Ensure focus outlines are visible (`:focus-visible`)
- Add `role="status"` to loading states
- Use semantic HTML (`<nav>`, `<main>`, `<button>` not `<div onClick>`)

---

## Todo List

- [ ] Create design tokens library (`design-tokens.ts`)
- [ ] Create `ProtectedRoute` component
- [ ] Create `AuraCard` component
- [ ] Create `AuraButton` component
- [ ] Update `App.tsx` with route protection
- [ ] Refactor `WithdrawalsPage` with Aura Elite
- [ ] Refactor `DistributorsPage` with Aura Elite
- [ ] Refactor `OrdersPage` with Aura Elite
- [ ] Refactor `DashboardPage` with Aura Elite
- [ ] Update Tailwind config with animations
- [ ] Test keyboard navigation
- [ ] Test screen reader compatibility
- [ ] Verify color contrast (WCAG AA)
- [ ] Test role-based access (admin vs distributor)
- [ ] Test protected route redirects
- [ ] Visual QA: Compare with main portal design
- [ ] Performance check: Measure glassmorphism impact

---

## Success Criteria

- ✅ All admin routes protected with role check
- ✅ Unauthorized users redirected to login
- ✅ Non-admin users see "Forbidden" page
- ✅ Visual consistency with distributor portal (Aura Elite)
- ✅ Glassmorphism effects maintain 60fps
- ✅ WCAG 2.1 AA compliance (4.5:1 contrast)
- ✅ Keyboard navigation works on all components
- ✅ Screen reader announces all state changes
- ✅ Zero layout shift during auth checks
- ✅ Design review approval from UI/UX team

---

## Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Glassmorphism performance on low-end devices | Medium | Medium | Fallback to solid backgrounds on mobile |
| Route protection breaks existing flows | High | Low | Comprehensive testing before deploy |
| Color contrast fails WCAG | Medium | Low | Use contrast checker tools during dev |
| Inconsistent styling across components | Low | Medium | Centralized design tokens enforce consistency |

---

## Security Considerations

1. **Role-Based Access Control**: Server-side validation in RLS policies (Phase 1)
2. **Client-Side Route Protection**: UX enhancement, not security boundary
3. **Session Management**: Proper token refresh on protected routes
4. **Audit Trail**: Log admin actions (future enhancement)

---

## Next Steps

After Phase 2 completion:
1. Proceed to Phase 3 (i18n + PWA)
2. Design review session with stakeholders
3. User acceptance testing with admin users
4. Document component usage in Storybook (future)

---

**Phase Owner:** Frontend Team
**Reviewers:** UI/UX Designer, Accessibility Expert
**Target Completion:** Day 2
