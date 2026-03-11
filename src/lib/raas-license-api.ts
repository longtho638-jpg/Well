/**
 * RaaS License Validation API Client
 *
 * Client library for validating license keys against RaaS Gateway.
 * Communicates with RaaS Gateway API for license verification.
 *
 * Usage:
 *   const result = await validateLicenseKey('RAAS-xxx', 'mk_api_key');
 *   storeValidatedLicense(result);
 *
 * Reference: RaaS Gateway v2.0.0 spec
 */

import type { LicenseValidationResult } from '@/lib/raas-gate'
import { createLogger } from '@/utils/logger'

const logger = createLogger('RaasLicenseApi')

export interface ValidateLicenseRequest {
  licenseKey: string
  mkApiKey?: string
  orgId?: string
}

export interface ValidateLicenseResponse extends LicenseValidationResult {
  daysRemaining?: number
  message?: string
}

export interface StoredLicenseState {
  isValid: boolean
  licenseKey?: string
  validation?: ValidateLicenseResponse
  validatedAt?: number
  source?: 'session' | 'local'
}

/**
 * RaaS Gateway API base URL
 * Use environment variable or default to production
 */
const RAAS_GATEWAY_URL =
  import.meta.env.VITE_RAAS_GATEWAY_URL ||
  'https://raas.agencyos.network'

/**
 * Validate license key against RaaS Gateway
 * Uses JWT + mk_ API key authentication
 */
export async function validateLicenseKey(
  request: ValidateLicenseRequest
): Promise<ValidateLicenseResponse> {
  const { licenseKey, mkApiKey, orgId } = request

  try {
    // Build request headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'AgencyOS-Dashboard/1.0',
    }

    // Add mk_ API key authentication if provided
    if (mkApiKey && mkApiKey.startsWith('mk_')) {
      headers['Authorization'] = `Bearer ${mkApiKey}`
    }

    // Add org context if available
    if (orgId) {
      headers['X-Org-ID'] = orgId
    }

    // Make request to RaaS Gateway
    const response = await fetch(`${RAAS_GATEWAY_URL}/v1/validate-license`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ licenseKey }),
    })

    const data = await response.json()

    if (!response.ok) {
      return {
        isValid: false,
        tier: 'basic',
        status: 'revoked',
        features: {
          adminDashboard: false,
          payosAutomation: false,
          premiumAgents: false,
          advancedAnalytics: false,
        },
        message: data.error || 'License validation failed',
      }
    }

    return {
      isValid: data.isValid,
      tier: data.tier || 'basic',
      status: data.isValid ? 'active' : 'revoked',
      features: data.features || {},
      expiresAt: data.expiresAt,
      daysRemaining: data.daysRemaining,
      message: data.message,
    }
  } catch (error) {
    logger.error('License validation failed', { error })
    return {
      isValid: false,
      tier: 'basic',
      status: 'revoked',
      features: {
        adminDashboard: false,
        payosAutomation: false,
        premiumAgents: false,
        advancedAnalytics: false,
      },
      message: error instanceof Error ? error.message : 'Network error',
    }
  }
}

/**
 * Store validated license in session/local storage
 */
export function storeValidatedLicense(
  state: StoredLicenseState,
  useLocalStorage: boolean = true
): void {
  try {
    const storage = useLocalStorage ? localStorage : sessionStorage
    const key = 'raas_license_state'

    const serialized = JSON.stringify({
      ...state,
      validatedAt: Date.now(),
      source: useLocalStorage ? 'local' : 'session',
    })

    storage.setItem(key, serialized)
  } catch (error) {
    logger.error('Failed to store license', { error })
  }
}

/**
 * Get validated license from storage
 */
export function getStoredLicense(): StoredLicenseState | null {
  try {
    // Try localStorage first
    const localData = localStorage.getItem('raas_license_state')
    if (localData) {
      return JSON.parse(localData)
    }

    // Fallback to sessionStorage
    const sessionData = sessionStorage.getItem('raas_license_state')
    if (sessionData) {
      return JSON.parse(sessionData)
    }

    return null
  } catch (error) {
    logger.error('Failed to get stored license', { error })
    return null
  }
}

/**
 * Clear stored license (for logout)
 */
export function clearStoredLicense(): void {
  try {
    localStorage.removeItem('raas_license_state')
    sessionStorage.removeItem('raas_license_state')
  } catch (error) {
    logger.error('Failed to clear stored license', { error })
  }
}

/**
 * Check if license is valid and active
 */
export function isLicenseValid(): boolean {
  const stored = getStoredLicense()
  if (!stored) return false
  return stored.isValid === true
}

/**
 * Get current license tier
 */
export function getLicenseTier(): string {
  const stored = getStoredLicense()
  return stored?.validation?.tier || 'basic'
}

/**
 * Check if user has access to a specific feature
 */
export function hasLicenseFeature(feature: string): boolean {
  const stored = getStoredLicense()
  if (!stored?.isValid) return false

  return stored.validation?.features?.[feature] || false
}

/**
 * Validate and store license key - complete flow
 */
export async function validateAndStoreLicense(
  licenseKey: string,
  options?: {
    mkApiKey?: string
    orgId?: string
    persistStorage?: boolean
  }
): Promise<ValidateLicenseResponse> {
  // Validate against RaaS Gateway
  const result = await validateLicenseKey({
    licenseKey,
    mkApiKey: options?.mkApiKey,
    orgId: options?.orgId,
  })

  // Store validation result
  if (result.isValid) {
    storeValidatedLicense(
      {
        isValid: true,
        licenseKey,
        validation: result,
      },
      options?.persistStorage !== false
    )
  }

  return result
}

/**
 * License validation client export
 */
export const raasLicenseClient = {
  validateLicenseKey,
  storeValidatedLicense,
  getStoredLicense,
  clearStoredLicense,
  isLicenseValid,
  getLicenseTier,
  hasLicenseFeature,
  validateAndStoreLicense,
}

export default raasLicenseClient
