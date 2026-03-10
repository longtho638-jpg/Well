/**
 * AgencyOS License Gate
 *
 * Wrapper component that gates the entire AgencyOS dashboard
 * behind RaaS license validation.
 *
 * Usage:
 *   <AgencyOSLicenseGate>
 *     <DashboardContent />
 *   </AgencyOSLicenseGate>
 *
 * Features:
 * - Blocks UI until valid license confirmed
 * - Shows onboarding flow for first-time users
 * - Stores validation in session storage
 * - Respects KV-based rate limits
 */

import React, { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Shield, Lock, AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useRaaSLicense } from '@/hooks/use-raas-license'
import { LicenseKeyInput } from '@/components/raas/LicenseKeyInput'
import { Button } from '@/components/ui/Button'

interface AgencyOSLicenseGateProps {
  children: React.ReactNode
  /**
   * Required feature to access dashboard
   * Default: 'adminDashboard'
   */
  requiredFeature?: string
  /**
   * Allow bypass in development
   * Default: false
   */
  allowBypass?: boolean
  /**
   * Custom onboarding content
   */
  onboardingContent?: React.ReactNode
}

export function AgencyOSLicenseGate({
  children,
  requiredFeature = 'adminDashboard',
  allowBypass = false,
  onboardingContent,
}: AgencyOSLicenseGateProps) {
  const { t } = useTranslation()
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [bypassActive, setBypassActive] = useState(false)

  const {
    isValid,
    isLoading,
    validateLicense,
    clearLicense,
    error,
  } = useRaaSLicense({
    autoValidate: true,
    requiredFeature,
    onSuccess: () => {
      setShowOnboarding(false)
    },
  })

  // Show onboarding if no valid license
  useEffect(() => {
    if (!isLoading && !isValid && !bypassActive) {
      setShowOnboarding(true)
    }
  }, [isLoading, isValid, bypassActive])

  // Bypass handler (dev only)
  const handleBypass = () => {
    if (allowBypass && process.env.NODE_ENV === 'development') {
      setBypassActive(true)
      setShowOnboarding(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto" />
          <p className="text-white text-lg">
            {t('raas.license_gate.validating')}
          </p>
        </div>
      </div>
    )
  }

  // Has valid license - render children
  if (isValid || bypassActive) {
    return <>{children}</>
  }

  // Show onboarding / license validation gate
  if (showOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <AnimatePresence>
          <div className="w-full max-w-2xl space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800 border border-slate-700 mb-4">
                <Shield className="h-8 w-8 text-slate-400" />
              </div>
              <h1 className="text-3xl font-bold text-white">
                {t('raas.license_gate.welcome_title')}
              </h1>
              <p className="text-slate-400 text-lg">
                {t('raas.license_gate.welcome_description')}
              </p>
            </div>

            {/* License Validation or Custom Onboarding */}
            <div className="flex items-center justify-center">
              {onboardingContent || (
                <LicenseKeyInput
                  onSuccess={() => {
                    setShowOnboarding(false)
                  }}
                  onError={(error) => {
                    console.error('License validation error:', error)
                  }}
                  autoFocus
                  showHelp
                />
              )}
            </div>

            {/* Info Cards */}
            <div className="grid md:grid-cols-3 gap-4 mt-8">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <Lock className="h-6 w-6 text-blue-400 mb-2" />
                <h3 className="text-white font-medium mb-1">
                  {t('raas.license_gate.features.secure_title')}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t('raas.license_gate.features.secure_description')}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <AlertCircle className="h-6 w-6 text-amber-400 mb-2" />
                <h3 className="text-white font-medium mb-1">
                  {t('raas.license_gate.features.compliant_title')}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t('raas.license_gate.features.compliant_description')}
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                <Shield className="h-6 w-6 text-emerald-400 mb-2" />
                <h3 className="text-white font-medium mb-1">
                  {t('raas.license_gate.features.managed_title')}
                </h3>
                <p className="text-slate-400 text-sm">
                  {t('raas.license_gate.features.managed_description')}
                </p>
              </div>
            </div>

            {/* Dev bypass */}
            {allowBypass && process.env.NODE_ENV === 'development' && (
              <div className="text-center mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBypass}
                  className="text-slate-500 hover:text-slate-400"
                >
                  {t('raas.license_gate.bypass_dev')}
                </Button>
              </div>
            )}
          </div>
        </AnimatePresence>
      </div>
    )
  }

  // Fallback
  return null
}

/**
 * Higher-Order Component version
 *
 * Usage:
 *   const ProtectedDashboard = withAgencyOSLicenseGuard(Dashboard)
 */
export function withAgencyOSLicenseGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AgencyOSLicenseGateProps, 'children'>
) {
  return function LicenseGuardedComponent(props: P) {
    return (
      <AgencyOSLicenseGate {...options}>
        <Component {...props} />
      </AgencyOSLicenseGate>
    )
  }
}

export default AgencyOSLicenseGate
