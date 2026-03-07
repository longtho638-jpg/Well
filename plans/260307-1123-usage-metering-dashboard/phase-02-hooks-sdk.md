---
phase: 2
title: React Hooks & SDK Integration
status: pending
effort: 2h
---

# Phase 2: React Hooks & SDK Integration

## Overview

Create React hooks (`useUsage`, `useQuota`) and context provider for usage tracking across the application. Integrate with existing UsageMeter SDK.

## Context Links

- **UsageMeter SDK:** `src/lib/usage-metering.ts` - Core SDK class
- **RaaS Hooks:** `src/hooks/use-raas-licenses.ts` - Pattern reference
- **Supabase Client:** `src/utils/api.ts` or `src/lib/supabase.ts`

## Key Insights

1. **UsageMeter SDK is class-based** - needs instantiation with `supabase`, `userId`, `licenseId`
2. **Hooks must handle auth** - get `userId` from current session
3. **Real-time updates** - poll every 30s or use Supabase Realtime
4. **Cache usage status** - avoid excessive API calls

## Requirements

### Functional

- [ ] `useUsage` hook - fetch current usage, track events
- [ ] `useQuota` hook - check quotas, warnings, enforcement status
- [ ] `UsageProvider` context - global usage state
- [ ] `useUsageMeter` hook - get UsageMeter instance

### Non-Functional

- TypeScript strict mode
- No memory leaks (proper cleanup in useEffect)
- Optimistic updates where possible

## Architecture

### Hook APIs

```typescript
// useUsage - Track and fetch usage
const { usage, loading, error, trackUsage, refresh } = useUsage()

// useQuota - Check quota status
const { quotas, warnings, isLimited, checkQuota } = useQuota()

// useUsageMeter - Get SDK instance
const { meter, instance } = useUsageMeter()
```

### UsageProvider Context

```typescript
interface UsageContextValue {
  userId: string | null
  licenseId: string | null
  tier: string
  usage: UsageDashboardData | null
  quotas: Record<string, UsageQuota>
  loading: boolean
  error: string | null
  trackUsage: (metric, data) => Promise<void>
  checkQuota: (feature) => Promise<QuotaCheckResponse>
  refresh: () => Promise<void>
}
```

## Implementation Steps

### Step 1: Create Usage Hooks File

**File:** `src/hooks/use-usage-metering.ts`

```typescript
import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { createClient } from '@supabase/supabase-js'
import { UsageMeter } from '@/lib/usage-metering'
import type { UsageStatus, TierLimits } from '@/lib/usage-metering'
import { useAuth } from './useAuth'

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ... (hook implementations)
```

### Step 2: Implement useUsage Hook

```typescript
export function useUsage(periodStart?: string, periodEnd?: string) {
  const { user } = useAuth()
  const [usage, setUsage] = useState<UsageStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsage(null)
      setLoading(false)
      return
    }

    try {
      const meter = new UsageMeter(supabase, { userId: user.id })
      const status = await meter.getUsageStatus(periodStart, periodEnd)
      setUsage(status)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [user, periodStart, periodEnd])

  const trackUsage = useCallback(async (
    metric: string,
    data: { quantity?: number; tokens?: number; metadata?: Record<string, unknown> }
  ) => {
    if (!user) return
    const meter = new UsageMeter(supabase, { userId: user.id })
    await meter.track(metric as any, data)
    await fetchUsage() // Refresh after tracking
  }, [user, fetchUsage])

  useEffect(() => {
    fetchUsage()
    // Poll every 30s for real-time updates
    const interval = setInterval(fetchUsage, 30000)
    return () => clearInterval(interval)
  }, [fetchUsage])

  return { usage, loading, error, trackUsage, refresh: fetchUsage }
}
```

### Step 3: Implement useQuota Hook

```typescript
export function useQuota() {
  const { user } = useAuth()
  const [quotas, setQuotas] = useState<Record<string, UsageQuota>>({})
  const [warnings, setWarnings] = useState<string[]>([])
  const [isLimited, setIsLimited] = useState(false)

  const checkQuota = useCallback(async (feature: string) => {
    if (!user) return { allowed: true }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-quota`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            user_id: user.id,
            feature,
          }),
        }
      )

      const data = await response.json()

      if (response.status === 429) {
        setIsLimited(true)
        setWarnings(prev => [...prev, ...data.warnings])
      }

      return data
    } catch (error) {
      console.error('[useQuota] Error:', error)
      return { allowed: false, error: 'Failed to check quota' }
    }
  }, [user])

  useEffect(() => {
    // Initial quota check for all features
    const features = ['api_call', 'tokens', 'model_inference', 'agent_execution']
    features.forEach(feature => {
      checkQuota(feature).then(data => {
        if (data) {
          setQuotas(prev => ({
            ...prev,
            [feature]: {
              feature,
              used: data.current_usage,
              limit: data.limit,
              remaining: data.remaining,
              percentage: data.percentage,
              reset_at: data.reset_at,
              status: data.allowed ? 'ok' : 'exceeded',
            },
          }))
          if (data.warnings) setWarnings(data.warnings)
        }
      })
    })
  }, [checkQuota])

  return { quotas, warnings, isLimited, checkQuota }
}
```

### Step 4: Implement UsageProvider

```typescript
const UsageContext = createContext<UsageContextValue | null>(null)

export function UsageProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { usage, loading: usageLoading, error: usageError, trackUsage, refresh } = useUsage()
  const { quotas, warnings, isLimited, checkQuota } = useQuota()

  const value: UsageContextValue = {
    userId: user?.id || null,
    licenseId: null, // TODO: Fetch from raas_licenses
    tier: 'free', // TODO: Fetch from license
    usage: usage,
    quotas,
    loading: usageLoading,
    error: usageError,
    trackUsage,
    checkQuota,
    refresh,
  }

  return (
    <UsageContext.Provider value={value}>
      {children}
    </UsageContext.Provider>
  )
}

export function useUsageContext() {
  const context = useContext(UsageContext)
  if (!context) {
    throw new Error('useUsageContext must be used within UsageProvider')
  }
  return context
}
```

### Step 5: Wrap App with UsageProvider

**File:** `src/main.tsx` or `src/App.tsx`

```typescript
import { UsageProvider } from './hooks/use-usage-metering'

// Wrap the app
<UsageProvider>
  <App />
</UsageProvider>
```

## Todo List

- [ ] Create `src/hooks/use-usage-metering.ts`
- [ ] Implement `useUsage` hook
- [ ] Implement `useQuota` hook
- [ ] Implement `useUsageMeter` hook
- [ ] Implement `UsageProvider` context
- [ ] Export hooks from `src/hooks/index.ts`
- [ ] Wrap app with `UsageProvider`
- [ ] Run `npm run build` - verify 0 errors

## Success Criteria

1. **Hooks Created:** All 3 hooks + context exist
2. **TypeScript Clean:** 0 type errors
3. **No Memory Leaks:** Proper cleanup in useEffect
4. **Auth Integration:** Works with logged-in users

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Excessive API calls | Medium | Poll every 30s, cache results |
| Auth race conditions | Medium | Check user before calling API |
| Memory leaks | Medium | Cleanup intervals in useEffect |

## Security Considerations

- Never expose service role key to frontend
- Use anon key for all client calls
- RLS ensures users only see own usage

## Next Steps

After Phase 2 complete:
1. Test hooks in isolation
2. Proceed to Phase 3 (Dashboard UI)

---

_Phase: 2/7 | Effort: 2h_
