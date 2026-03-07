/**
 * UpgradeModal Component - ROIaaS Phase 5
 * Modal hiển thị upgrade options khi user cố access premium features
 */

import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { X, Check, ArrowRight } from 'lucide-react'
import type { LicenseTier } from '@/types/license'
import { TIER_CONFIG } from '@/types/license'

interface UpgradeModalProps {
  open: boolean
  onClose: () => void
  currentTier: LicenseTier
  targetTier: LicenseTier
}

export function UpgradeModal({ open, onClose, currentTier, targetTier }: UpgradeModalProps) {
  const { t } = useTranslation()

  if (!open) return null

  const tiers: LicenseTier[] = ['free', 'pro', 'enterprise']
  const tierOrder: Record<LicenseTier, number> = { free: 0, pro: 1, enterprise: 2 }

  // Chỉ hiển thị tiers cao hơn current tier
  const _upgradeTiers = tiers.filter(t => tierOrder[t] >= tierOrder[targetTier])

  const handleUpgrade = (tier: LicenseTier) => {
    // TODO: Link đến Polar checkout URL
    const polarUrls: Record<LicenseTier, string> = {
      free: '#',
      pro: 'https://buy.polar.sh/polar-cl_pro-plan',
      enterprise: 'https://buy.polar.sh/polar-cl_enterprise',
    }
    window.open(polarUrls[tier], '_blank')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              Nâng Cấp Gói Dịch Vụ
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Mở khóa toàn bộ tiềm năng analytics
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Current tier notice */}
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-sm text-blue-400">
              <span className="font-medium">Gói hiện tại:</span>{' '}
              <span className="uppercase">{currentTier}</span>
              {currentTier === 'free' && ' - Chỉ truy cập được metrics cơ bản'}
            </p>
          </div>

          {/* Tier comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tiers.map((tier) => {
              const config = TIER_CONFIG[tier]
              const isCurrent = tier === currentTier
              const isTarget = tier === targetTier

              return (
                <div
                  key={tier}
                  className={cn(
                    'p-5 rounded-xl border transition-all',
                    isCurrent
                      ? 'bg-blue-500/10 border-blue-500/50'
                      : 'bg-gray-700/30 border-gray-600/50',
                    isTarget && 'ring-2 ring-purple-500/50'
                  )}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {config.label}
                      </h3>
                      {config.price && (
                        <p className="text-sm text-gray-400 mt-1">
                          {config.price}
                        </p>
                      )}
                    </div>
                    {isCurrent && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-md font-medium">
                        Hiện tại
                      </span>
                    )}
                  </div>

                  {/* Features list */}
                  <ul className="space-y-2 mb-4">
                    <FeatureItem
                      label="Basic Metrics"
                      available={config.features.basicMetrics}
                    />
                    <FeatureItem
                      label="Advanced Analytics"
                      available={config.features.advancedAnalytics}
                    />
                    <FeatureItem
                      label="Export CSV"
                      available={config.features.exportCSV}
                    />
                    <FeatureItem
                      label="Export PDF"
                      available={config.features.exportPDF}
                    />
                    <FeatureItem
                      label="Real-time Sync (30s)"
                      available={config.features.realTimeSync}
                    />
                    <FeatureItem
                      label="Custom Date Range"
                      available={config.features.customDateRange}
                    />
                  </ul>

                  {/* Upgrade button */}
                  {tier !== currentTier && tierOrder[tier] > tierOrder[currentTier] && (
                    <button
                      onClick={() => handleUpgrade(tier)}
                      className={cn(
                        'w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2',
                        tier === 'enterprise'
                          ? 'bg-purple-500 hover:bg-purple-600 text-white'
                          : 'bg-blue-500 hover:bg-blue-600 text-white'
                      )}
                    >
                      Nâng Cấp
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* CTA Footer */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/30 rounded-xl">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-white font-medium mb-1">
                  Cần gói Enterprise tùy chỉnh?
                </h4>
                <p className="text-sm text-gray-400">
                  Liên hệ để có giải pháp phù hợp với doanh nghiệp của bạn
                </p>
              </div>
              <a
                href="mailto:sales@wellnexus.vn"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                Liên Hệ
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ label, available }: { label: string; available: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      {available ? (
        <Check className="w-4 h-4 text-emerald-400" />
      ) : (
        <X className="w-4 h-4 text-gray-600" />
      )}
      <span className={available ? 'text-gray-300' : 'text-gray-500 line-through'}>
        {label}
      </span>
    </li>
  )
}

export default UpgradeModal
