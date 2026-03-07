---
phase: 5
title: Quota Enforcement Layer
status: pending
effort: 2h
---

# Phase 5: Quota Enforcement Layer

## Overview

Implement quota enforcement that blocks API calls when users exceed their tier limits. Uses Edge Function `/check-quota` for real-time validation and returns HTTP 429 when quota exceeded.

## Context Links

- **Check Quota Function:** `supabase/functions/check-quota/index.ts` - Already exists (Phase 4)
- **RaaS Gate:** `src/lib/raas-gate.ts` - Pattern reference
- **Tier Limits:** `src/lib/usage-metering.ts` lines 62-68

## Key Insights

1. **Edge Function already exists** - `/check-quota` returns 200 or 429
2. **Frontend must handle 429** - Show upgrade prompt, block actions
3. **Grace period** - Warn at 80%, hard block at 100%
4. **Cache quota status** - Don't check on every request (stale-while-revalidate)

## Requirements

### Functional

- [ ] Check quota before allowing actions
- [ ] Block API calls when quota exceeded (429)
- [ ] Show warnings at 80% and 90%
- [ ] Display upgrade prompt when blocked
- [ ] Cache quota status (5 min TTL)

### Non-Functional

- Graceful degradation (if check fails, allow with warning)
- Optimistic UI (show blocked state before API call)
- Clear error messages (user knows why blocked)

## Architecture

### Quota Check Flow

```
User Action → Check Local Cache → If stale, call /check-quota
                                           │
                                           ▼
                                    Allowed (200) → Proceed
                                           │
                                           ▼
                                    Blocked (429) → Show Upgrade Prompt
```

### Cache Strategy

```typescript
interface QuotaCache {
  feature: string
  allowed: boolean
  remaining: number
  checkedAt: number  // timestamp
  ttl: number        // 5 minutes
}
```

## Implementation Steps

### Step 1: Create Quota Guard Hook

**File:** `src/hooks/use-quota-guard.ts`

```typescript
import { useState, useEffect, useCallback } from 'react'
import { useAuth } from './useAuth'

interface QuotaStatus {
  feature: string
  allowed: boolean
  current_usage: number
  limit: number
  remaining: number
  percentage: number
  warnings: string[]
  reset_at: string
  lastChecked: number
}

const QUOTA_TTL = 5 * 60 * 1000 // 5 minutes
const quotaCache = new Map<string, QuotaStatus>()

export function useQuotaGuard(feature: string) {
  const { user } = useAuth()
  const [status, setStatus] = useState<QuotaStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [blocked, setBlocked] = useState(false)

  const checkQuota = useCallback(async (force = false) => {
    if (!user) return

    const cached = quotaCache.get(feature)
    const now = Date.now()

    // Return cached if still valid
    if (cached && !force && (now - cached.lastChecked) < QUOTA_TTL) {
      setStatus(cached)
      setBlocked(!cached.allowed)
      return cached
    }

    setLoading(true)
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
            requested_quantity: 1,
          }),
        }
      )

      const data = await response.json()

      const newStatus: QuotaStatus = {
        feature,
        allowed: response.status === 200,
        current_usage: data.current_usage,
        limit: data.limit,
        remaining: data.remaining,
        percentage: data.percentage,
        warnings: data.warnings || [],
        reset_at: data.reset_at,
        lastChecked: now,
      }

      quotaCache.set(feature, newStatus)
      setStatus(newStatus)
      setBlocked(!newStatus.allowed)

      return newStatus
    } catch (error) {
      console.error('[useQuotaGuard] Error:', error)
      // Graceful degradation: allow if check fails
      return { allowed: true, error: 'Failed to check quota' }
    } finally {
      setLoading(false)
    }
  }, [user, feature])

  useEffect(() => {
    checkQuota()
    // Recheck every 2 minutes
    const interval = setInterval(() => checkQuota(), 2 * 60 * 1000)
    return () => clearInterval(interval)
  }, [checkQuota])

  return {
    allowed: status?.allowed ?? true,
    blocked,
    loading,
    remaining: status?.remaining ?? 0,
    limit: status?.limit ?? -1,
    percentage: status?.percentage ?? 0,
    warnings: status?.warnings ?? [],
    reset_at: status?.reset_at,
    checkQuota,
  }
}
```

### Step 2: Create Quota Guard Component

**File:** `src/components/QuotaGuard.tsx`

```typescript
import React from 'react'
import { useQuotaGuard } from '@/hooks/use-quota-guard'
import { useTranslation } from 'react-i18next'
import { AlertTriangle, Lock, Zap } from 'lucide-react'

interface QuotaGuardProps {
  feature: string
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function QuotaGuard({ feature, children, fallback }: QuotaGuardProps) {
  const { t } = useTranslation('dashboard')
  const { allowed, blocked, loading, warnings, percentage, checkQuota } = useQuotaGuard(feature)

  if (loading) {
    return <QuotaGuardSkeleton />
  }

  if (blocked) {
    if (fallback) return fallback

    return (
      <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-6 text-center">
        <Lock className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-red-400 mb-2">
          {t('usage.quota_exceeded')}
        </h3>
        <p className="text-white/80 mb-4">
          {t('usage.quota_exceeded_message', { feature: t(`usage.features.${feature}`) })}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => checkQuota(true)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition"
          >
            {t('usage.retry_check')}
          </button>
          <a
            href="/dashboard/subscription"
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition"
          >
            {t('usage.upgrade_plan')}
          </a>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}
      {warnings.length > 0 && (
        <div className="mt-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 flex items-start gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-yellow-400 font-medium text-sm">
              {t('usage.quota_warning')}
            </p>
            <ul className="text-white/70 text-sm mt-1">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {percentage >= 80 && (
        <div className="mt-2 text-xs text-yellow-400">
          {t('usage.quota_at_percentage', { percentage, feature: t(`usage.features.${feature}`) })}
        </div>
      )}
    </>
  )
}
```

### Step 3: Wrap Protected Actions with QuotaGuard

**Example:** AI Chat Component

```typescript
import { QuotaGuard } from '@/components/QuotaGuard'

function ChatInterface() {
  return (
    <QuotaGuard feature="model_inference">
      <ChatInput />
      <ChatHistory />
    </QuotaGuard>
  )
}
```

**Example:** Agent Runner Button

```typescript
import { QuotaGuard } from '@/components/QuotaGuard'

function AgentRunner() {
  return (
    <QuotaGuard feature="agent_execution" fallback={<AgentDisabledUI />}>
      <RunAgentButton />
    </QuotaGuard>
  )
}
```

### Step 4: Add Upgrade Prompt Modal

**File:** `src/components/UpgradePromptModal.tsx`

```typescript
import React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

interface UpgradePromptModalProps {
  isOpen: boolean
  onClose: () => void
  feature: string
}

export function UpgradePromptModal({ isOpen, onClose, feature }: UpgradePromptModalProps) {
  const { t } = useTranslation('dashboard')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 rounded-2xl border border-white/10 p-8 max-w-md w-full">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-2xl font-bold text-white mb-4">
          {t('usage.upgrade_required')}
        </h2>

        <p className="text-white/80 mb-6">
          {t('usage.upgrade_required_message', {
            feature: t(`usage.features.${feature}`),
          })}
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-white/70">
            <Zap className="w-5 h-5 text-purple-400" />
            <span>{t('usage.upgrade_benefit_1')}</span>
          </div>
          <div className="flex items-center gap-3 text-white/70">
            <Zap className="w-5 h-5 text-purple-400" />
            <span>{t('usage.upgrade_benefit_2')}</span>
          </div>
        </div>

        <a
          href="/dashboard/subscription"
          className="block w-full py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white text-center font-medium transition"
        >
          {t('usage.view_plans')}
        </a>
      </div>
    </div>
  )
}
```

## Todo List

- [ ] Create `src/hooks/use-quota-guard.ts`
- [ ] Create `src/components/QuotaGuard.tsx`
- [ ] Create `src/components/UpgradePromptModal.tsx`
- [ ] Wrap AI chat with `QuotaGuard`
- [ ] Wrap agent runner with `QuotaGuard`
- [ ] Add i18n keys for quota messages
- [ ] Run `npm run build` - verify 0 errors
- [ ] Test: Exceed quota, verify 429 and upgrade prompt

## Success Criteria

1. **429 Handling:** HTTP 429 triggers blocked state
2. **Upgrade Prompt:** User sees upgrade option when blocked
3. **Warnings Work:** 80%/90% warnings display correctly
4. **Cache Works:** Quota status cached for 5 minutes

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| False positive blocks | High | Graceful degradation, allow on error |
| Quota check latency | Medium | Cache with 5min TTL |
| User frustration | Medium | Clear messaging, easy upgrade path |

## Security Considerations

- Never trust frontend quota checks alone
- Always validate on backend/Edge Function
- RLS ensures users can't modify others' usage

## Next Steps

After Phase 5 complete:
1. Test quota enforcement with test user
2. Verify 429 responses block actions
3. Proceed to Phase 6 (Billing Sync)

---

_Phase: 5/7 | Effort: 2h_
