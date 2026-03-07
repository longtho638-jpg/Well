/**
 * PremiumGate Component - ROIaaS Phase 5
 * Component để gate nội dung theo license tier
 */

import React from 'react'
import { useLicenseTier } from '@/hooks/use-license-tier'
import type { LicenseTier, PremiumGateProps } from '@/types/license'
import { Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * PremiumGate - Wrapper để hiển thị/ẩn nội dung theo tier
 */
export function PremiumGate({
  tier: requiredTier,
  children,
  fallback,
}: PremiumGateProps) {
  const { tier, canAccess, isLoading } = useLicenseTier()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    )
  }

  if (canAccess(requiredTier)) {
    return <>{children}</>
  }

  // Default fallback cho non-premium users
  if (!fallback) {
    return (
      <div className={cn(
        'relative rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50',
        'overflow-hidden'
      )}>
        {/* Blur effect */}
        <div className="absolute inset-0 backdrop-blur-md z-10 flex items-center justify-center">
          <div className="text-center p-6">
            <Lock className="w-12 h-12 mx-auto mb-4 text-amber-400" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Premium Feature
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              Nâng cấp lên {requiredTier.charAt(0).toUpperCase() + requiredTier.slice(1)} để mở khóa
            </p>
          </div>
        </div>
        {/* Blurred content behind */}
        <div className="filter blur-sm opacity-50">
          {children}
        </div>
      </div>
    )
  }

  return <>{fallback}</>
}

/**
 * PremiumBadge - Hiển thị badge tier hiện tại
 */
export function PremiumBadge({ className }: { className?: string }) {
  const { tier } = useLicenseTier()

  const tierColors: Record<LicenseTier, string> = {
    free: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    pro: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }

  return (
    <div
      className={cn(
        'px-3 py-1 rounded-lg text-xs font-medium border transition-all',
        tierColors[tier]
      )}
    >
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </div>
  )
}

export default PremiumGate
