/**
 * Plan Upgrade CTA Component
 * Displays upgrade prompts when user approaches quota limits
 */

import React from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowUpRight } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface PlanUpgradeCTAProps {
  currentOverage?: number
  currentTier?: string
  suggestedTier?: string
  onUpgrade?: () => void
}

export function PlanUpgradeCTA({ currentTier, suggestedTier, onUpgrade }: PlanUpgradeCTAProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-gradient-to-r from-amber-900/50 to-orange-900/50 border border-amber-700/50 rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-amber-200">
            {t('billing.overage.upgrade_needed')}
          </h3>
          <p className="text-amber-300/80 text-sm mt-1">
            {t('billing.overage.upgrade_description')}
          </p>
        </div>
        <ArrowUpRight className="text-amber-400" size={24} />
      </div>

      <div className="mt-4 flex gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={onUpgrade}
        >
          {t('billing.overage.upgrade_now')}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => window.open('/dashboard/billing', '_blank')}
        >
          {t('billing.overage.view_plans')}
        </Button>
      </div>
    </div>
  )
}
