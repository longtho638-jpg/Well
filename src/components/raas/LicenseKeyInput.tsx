/**
 * RaaS License Key Input Component
 *
 * Form component for users to enter and validate their RaaS license key.
 * Used in dashboard onboarding flow.
 *
 * Features:
 * - License key input with format validation
 * - Real-time validation against RaaS Gateway
 * - Success/error states with visual feedback
 * - Help text and support links
 */

import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Key, Check, X, Loader2, AlertCircle, ExternalLink } from 'lucide-react'
import { useRaaSLicense } from '@/hooks/use-raas-license'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'

export interface LicenseKeyInputProps {
  /**
   * Callback when license is successfully validated
   */
  onSuccess?: () => void

  /**
   * Callback when validation fails
   */
  onError?: (error: string) => void

  /**
   * Pre-fill license key (for testing/dev)
   */
  defaultValue?: string

  /**
   * Show helper text and links
   * Default: true
   */
  showHelp?: boolean

  /**
   * Auto-focus on mount
   * Default: true
   */
  autoFocus?: boolean

  /**
   * Disable manual input (for read-only display)
   * Default: false
   */
  readOnly?: boolean
}

export function LicenseKeyInput({
  onSuccess,
  onError,
  defaultValue = '',
  showHelp = true,
  autoFocus = true,
  readOnly = false,
}: LicenseKeyInputProps) {
  const { t } = useTranslation()

  const [licenseKey, setLicenseKey] = useState(defaultValue)
  const [showKey, setShowKey] = useState(false)

  const {
    isValid,
    tier,
    daysRemaining,
    isVerifying,
    error,
    validateLicense,
  } = useRaaSLicense({
    onSuccess: () => {
      onSuccess?.()
    },
    onError: (err) => {
      onError?.(err)
    },
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!licenseKey.trim()) {
      return
    }

    await validateLicense(licenseKey.trim())
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLicenseKey(value)

    // Clear error when user starts typing
    if (error) {
      // Will be cleared by validation
    }
  }

  const getTierBadgeColor = (tier: string) => {
    const colors: Record<string, string> = {
      basic: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
      premium: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      enterprise: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      master: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    }
    return colors[tier] || colors.basic
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          {t('raas.license_key_input.title')}
        </CardTitle>
        <CardDescription>
          {t('raas.license_key_input.description')}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {/* License Key Input */}
          <div className="space-y-2">
            <Label htmlFor="license-key">
              {t('raas.license_key_input.label')}
            </Label>

            <div className="relative">
              <Input
                id="license-key"
                type={showKey ? 'text' : 'password'}
                value={licenseKey}
                onChange={handleInputChange}
                disabled={isVerifying || readOnly}
                autoFocus={autoFocus && !readOnly}
                placeholder={t('raas.license_key_input.placeholder')}
                className="pr-20 font-mono text-sm"
                autoComplete="off"
              />

              {/* Show/Hide toggle */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                disabled={readOnly}
              >
                {showKey ? '👁️' : '👁️‍🗨️'}
              </Button>
            </div>

            {!readOnly && (
              <p className="text-xs text-muted-foreground">
                {t('raas.license_key_input.help')}
              </p>
            )}
          </div>

          {/* Validation Status */}
          {isVerifying && (
            <Alert className="bg-blue-500/10 border-blue-500/20">
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>
                {t('raas.license_key_input.verifying')}
              </AlertTitle>
              <AlertDescription>
                {t('raas.license_key_input.verifying_description')}
              </AlertDescription>
            </Alert>
          )}

          {isValid && (
            <Alert className="bg-emerald-500/10 border-emerald-500/20">
              <Check className="h-4 w-4" />
              <AlertTitle className="flex items-center gap-2">
                {t('raas.license_key_input.valid')}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border ${getTierBadgeColor(tier)}`}
                >
                  {tier.toUpperCase()}
                </span>
              </AlertTitle>
              {daysRemaining && (
                <AlertDescription>
                  {t('raas.license_key_input.expires_in', {
                    days: daysRemaining,
                  })}
                </AlertDescription>
              )}
            </Alert>
          )}

          {error && !isVerifying && (
            <Alert variant="destructive" className="bg-rose-500/10 border-rose-500/20">
              <X className="h-4 w-4" />
              <AlertTitle>{t('raas.license_key_input.invalid')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Feature List */}
          {isValid && showHelp && (
            <div className="space-y-2 pt-2">
              <h4 className="text-sm font-medium">
                {t('raas.license_key_input.included_features')}
              </h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {t('raas.features.admin_dashboard')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {t('raas.features.payos_automation')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {t('raas.features.usage_metering')}
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {t('raas.features.multi_tenant')}
                </li>
              </ul>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3">
          {!readOnly && (
            <Button
              type="submit"
              disabled={!licenseKey.trim() || isVerifying}
              className="w-full"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t('raas.license_key_input.verifying_button')}
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {t('raas.license_key_input.validate_button')}
                </>
              )}
            </Button>
          )}

          {showHelp && (
            <div className="text-xs text-center space-y-2">
              <p className="text-muted-foreground">
                {t('raas.license_key_input.need_license')}
              </p>
              <div className="flex items-center justify-center gap-4">
                <a
                  href="https://raas.agencyos.network/pricing"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  {t('raas.license_key_input.get_license')}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <a
                  href="https://docs.raas.agencyos.network"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  {t('raas.license_key_input.documentation')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </CardFooter>
      </form>
    </Card>
  )
}

export default LicenseKeyInput
