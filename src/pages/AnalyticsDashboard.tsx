/**
 * Analytics Dashboard Page - ROIaaS Phase 1 Simplified
 * Minimal placeholder UI confirming RaaS License Key is active
 * No i18n, no external dependencies
 */

import { useState } from 'react'
import { useRaaSLicense } from '@/hooks/use-raas-license'
import { cn } from '@/lib/utils'
import { CheckCircle2, Key, Shield } from 'lucide-react'

export function AnalyticsDashboardPage() {
  const { isValid, tier, daysRemaining } = useRaaSLicense({
    autoValidate: true,
  })

  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  // Show loading state
  if (isValid === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto" />
          <p className="text-gray-400">Validating license...</p>
        </div>
      </div>
    )
  }

  // Show license required state
  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-black">
        <div className="max-w-md p-6 bg-gray-800/50 rounded-xl border border-gray-700 text-center">
          <Shield className="h-16 w-16 mx-auto text-rose-500 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">License Required</h2>
          <p className="text-gray-400">
            Please activate your RaaS License Key to access the dashboard
          </p>
        </div>
      </div>
    )
  }

  // Show simplified dashboard
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-black p-6">
      {/* Header - License Status */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">RaaS License Active</h1>
              <p className="text-gray-400">
                Tier: <span className="text-emerald-400 font-semibold uppercase">{tier || 'Basic'}</span>
                {daysRemaining && (
                  <span className="ml-2 text-gray-500">
                    • Expires in {daysRemaining} days
                  </span>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 transition-all disabled:opacity-50"
          >
            <div className={cn('w-5 h-5', refreshing && 'animate-spin')}>
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {/* Placeholder Content */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* License Info Card */}
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <Key className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold text-white">License Details</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-emerald-400">Active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Tier</span>
                <span className="text-white uppercase">{tier || 'Basic'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Expires</span>
                <span className="text-white">
                  {daysRemaining ? `${daysRemaining} days` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Placeholder cards */}
          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <h3 className="font-semibold text-white mb-2">Analytics</h3>
            <p className="text-gray-400 text-sm">Coming in Phase 2</p>
          </div>

          <div className="p-6 bg-gray-800/50 rounded-xl border border-gray-700">
            <h3 className="font-semibold text-white mb-2">Usage Metrics</h3>
            <p className="text-gray-400 text-sm">Coming in Phase 2</p>
          </div>
        </div>

        {/* Phase 2 Notice */}
        <div className="mt-8 p-6 bg-blue-500/10 rounded-xl border border-blue-500/20">
          <h3 className="font-semibold text-blue-400 mb-2">Phase 1 - License Validation</h3>
          <p className="text-gray-400 text-sm">
            This is a minimal placeholder UI confirming your RaaS License Key is active.
            Full analytics dashboard with revenue metrics, user analytics, and ROI calculations
            will be available in Phase 2.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-7xl mx-auto mt-8 pt-6 border-t border-white/10">
        <div className="text-sm text-gray-500">
          RaaS Dashboard v1.0 - Phase 1: License Validation
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboardPage
