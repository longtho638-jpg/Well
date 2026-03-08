/**
 * useRaaSLicense Hook
 *
 * React hook for RaaS license validation and management.
 * Provides license state, validation, and storage management.
 *
 * Usage:
 *   const { isValid, tier, validateLicense, isLoading } = useRaaSLicense()
 */

import { useState, useEffect, useCallback } from 'react'
import {
  validateLicenseKey,
  storeValidatedLicense,
  getStoredLicense,
  clearStoredLicense,
  type ValidateLicenseResponse,
  type StoredLicenseState,
} from '@/lib/raas-license-api'

export interface UseRaaSLicenseReturn {
  // License state
  isValid: boolean
  tier: string
  status: string
  features: Record<string, boolean>
  daysRemaining?: number

  // Loading/error state
  isLoading: boolean
  error: string | null
  isVerifying: boolean

  // Actions
  validateLicense: (licenseKey: string, mkApiKey?: string) => Promise<boolean>
  clearLicense: () => void
  refreshLicense: () => Promise<void>

  // Storage
  storageSource?: 'session' | 'local'
  validatedAt?: number
}

export interface UseRaaSLicenseOptions {
  /**
   * Auto-validate on mount using stored license
   * Default: true
   */
  autoValidate?: boolean

  /**
   * Storage type: 'session' | 'local' | 'both'
   * Default: 'both' (try local first, fallback to session)
   */
  storageType?: 'session' | 'local' | 'both'

  /**
   * Required feature to check
   * If provided, isValid will be false if feature not available
   */
  requiredFeature?: string

  /**
   * Callback when license validated successfully
   */
  onSuccess?: () => void

  /**
   * Callback when license validation failed
   */
  onError?: (error: string) => void
}

export function useRaaSLicense(
  options: UseRaaSLicenseOptions = {}
): UseRaaSLicenseReturn {
  const {
    autoValidate = true,
    storageType = 'both',
    requiredFeature,
    onSuccess,
    onError,
  } = options

  // License state
  const [isValid, setIsValid] = useState(false)
  const [tier, setTier] = useState<string>('basic')
  const [status, setStatus] = useState<string>('pending')
  const [features, setFeatures] = useState<Record<string, boolean>>({})
  const [daysRemaining, setDaysRemaining] = useState<number | undefined>()

  // Loading/error state
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // Storage metadata
  const [storageSource, setStorageSource] = useState<'session' | 'local' | undefined>()
  const [validatedAt, setValidatedAt] = useState<number | undefined>()

  /**
   * Load license from storage on mount
   */
  useEffect(() => {
    if (!autoValidate) {
      setIsLoading(false)
      return
    }

    const stored = getStoredLicense()

    if (stored?.isValid) {
      setIsValid(true)
      setTier(stored.validation?.tier || 'basic')
      setStatus(stored.validation?.status || 'active')
      setFeatures(stored.validation?.features || {})
      setDaysRemaining(stored.validation?.daysRemaining)
      setStorageSource(stored.source)
      setValidatedAt(stored.validatedAt)
    } else {
      // No valid license stored
      setIsValid(false)
      setStatus('pending')
    }

    setIsLoading(false)
  }, [autoValidate])

  /**
   * Check if feature is available
   */
  useEffect(() => {
    if (requiredFeature && isValid) {
      const hasFeature = features[requiredFeature]
      if (!hasFeature) {
        setIsValid(false)
        setStatus('missing_feature')
      }
    }
  }, [requiredFeature, features, isValid])

  /**
   * Validate license key against RaaS Gateway
   */
  const validateLicense = useCallback(
    async (licenseKey: string, mkApiKey?: string): Promise<boolean> => {
      setIsVerifying(true)
      setError(null)

      try {
        const result = await validateLicenseKey({
          licenseKey,
          mkApiKey,
        })

        if (result.isValid) {
          // Store validated license
          storeValidatedLicense({
            isValid: true,
            licenseKey,
            validation: result,
          }, storageType !== 'session')

          // Update state
          setIsValid(true)
          setTier(result.tier)
          setStatus(result.status)
          setFeatures(result.features)
          setDaysRemaining(result.daysRemaining)
          setStorageSource(storageType !== 'session' ? 'local' : 'session')
          setValidatedAt(Date.now())

          onSuccess?.()
          return true
        } else {
          // Validation failed
          setIsValid(false)
          setStatus('revoked')
          setError(result.message || 'License validation failed')

          onError?.(result.message || 'License validation failed')
          return false
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Network error'
        setError(errorMessage)
        setIsValid(false)
        setStatus('error')

        onError?.(errorMessage)
        return false
      } finally {
        setIsVerifying(false)
      }
    },
    [storageType, onSuccess, onError]
  )

  /**
   * Clear stored license
   */
  const clearLicense = useCallback(() => {
    clearStoredLicense()
    setIsValid(false)
    setTier('basic')
    setStatus('pending')
    setFeatures({})
    setDaysRemaining(undefined)
    setStorageSource(undefined)
    setValidatedAt(undefined)
    setError(null)
  }, [])

  /**
   * Refresh license from storage
   */
  const refreshLicense = useCallback(async () => {
    const stored = getStoredLicense()

    if (stored?.isValid) {
      setIsValid(true)
      setTier(stored.validation?.tier || 'basic')
      setStatus(stored.validation?.status || 'active')
      setFeatures(stored.validation?.features || {})
      setDaysRemaining(stored.validation?.daysRemaining)
      setStorageSource(stored.source)
      setValidatedAt(stored.validatedAt)
    } else {
      setIsValid(false)
      setStatus('pending')
    }
  }, [])

  return {
    isValid,
    tier,
    status,
    features,
    daysRemaining,
    isLoading,
    error,
    isVerifying,
    validateLicense,
    clearLicense,
    refreshLicense,
    storageSource,
    validatedAt,
  }
}

export default useRaaSLicense
