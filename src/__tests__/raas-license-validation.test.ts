/**
 * RaaS License Validation Tests
 *
 * Tests for:
 * - raas-license-api.ts: API client functions
 * - useRaaSLicense.ts: React hook
 * - LicenseKeyInput.tsx: Component
 * - AgencyOSLicenseGate.tsx: Gate wrapper
 *
 * Run: npm test -- raas-license-validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import {
  validateLicenseKey,
  storeValidatedLicense,
  getStoredLicense,
  clearStoredLicense,
  isLicenseValid,
  validateAndStoreLicense,
  raasLicenseClient,
} from '@/lib/raas-license-api'
import { useRaaSLicense } from '@/hooks/use-raas-license'

// Mock fetch globally
global.fetch = vi.fn()

// Mock localStorage
const localStorageMock = {
  store: {} as Record<string, string>,
  getItem: function (key: string) {
    return this.store[key] || null
  },
  setItem: function (key: string, value: string) {
    this.store[key] = value
  },
  removeItem: function (key: string) {
    delete this.store[key]
  },
  clear: function () {
    this.store = {}
  },
}

vi.stubGlobal('localStorage', localStorageMock)
vi.stubGlobal('sessionStorage', localStorageMock)

// ============================================================
// API Client Tests
// ============================================================

describe('raas-license-api', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  describe('validateLicenseKey()', () => {
    it('should return valid license response for valid key', async () => {
      const mockResponse = {
        isValid: true,
        tier: 'premium',
        status: 'active',
        features: {
          adminDashboard: true,
          payosAutomation: true,
          premiumAgents: true,
          advancedAnalytics: true,
        },
        daysRemaining: 300,
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await validateLicenseKey({
        licenseKey: 'RAAS-TEST-KEY-12345',
        mkApiKey: 'mk_test_api_key',
      })

      expect(result.isValid).toBe(true)
      expect(result.tier).toBe('premium')
      expect(result.status).toBe('active')
      expect(result.features.adminDashboard).toBe(true)
    })

    it('should return invalid response for invalid key', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Invalid license key',
        }),
      } as Response)

      const result = await validateLicenseKey({
        licenseKey: 'INVALID-KEY',
      })

      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Invalid license key')
    })

    it('should handle network errors gracefully', async () => {
      vi.spyOn(global, 'fetch').mockRejectedValueOnce(
        new Error('Network error')
      )

      const result = await validateLicenseKey({
        licenseKey: 'RAAS-TEST-KEY',
      })

      expect(result.isValid).toBe(false)
      expect(result.message).toBe('Network error')
    })

    it('should send mk_ API key in Authorization header', async () => {
      const mockResponse = {
        isValid: true,
        tier: 'basic',
        status: 'active',
        features: {},
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      await validateLicenseKey({
        licenseKey: 'RAAS-TEST-KEY',
        mkApiKey: 'mk_test_key_123',
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/v1/validate-license'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer mk_test_key_123',
          }),
        })
      )
    })

    it('should include X-Org-ID header when provided', async () => {
      const mockResponse = { isValid: true, tier: 'basic', status: 'active', features: {} }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      await validateLicenseKey({
        licenseKey: 'RAAS-TEST-KEY',
        orgId: 'org-123',
      })

      expect(fetch).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Org-ID': 'org-123',
          }),
        })
      )
    })
  })

  describe('storeValidatedLicense()', () => {
    it('should store license in localStorage by default', () => {
      const state = {
        isValid: true,
        licenseKey: 'RAAS-TEST-KEY',
        validation: {
          tier: 'premium',
          status: 'active',
          features: { adminDashboard: true },
        },
      }

      storeValidatedLicense(state, true)

      const stored = JSON.parse(localStorageMock.getItem('raas_license_state')!)
      expect(stored.isValid).toBe(true)
      expect(stored.licenseKey).toBe('RAAS-TEST-KEY')
      expect(stored.source).toBe('local')
    })

    it('should store license in sessionStorage when useLocalStorage is false', () => {
      const state = {
        isValid: true,
        licenseKey: 'RAAS-TEST-KEY',
        validation: { tier: 'basic', status: 'active', features: {} },
      }

      storeValidatedLicense(state, false)

      const stored = JSON.parse(sessionStorage.getItem('raas_license_state')!)
      expect(stored.source).toBe('session')
    })
  })

  describe('getStoredLicense()', () => {
    it('should retrieve license from localStorage first', () => {
      const state = {
        isValid: true,
        licenseKey: 'RAAS-TEST-KEY',
        validation: { tier: 'premium', status: 'active', features: {} },
        validatedAt: Date.now(),
        source: 'local',
      }

      localStorageMock.setItem('raas_license_state', JSON.stringify(state))

      const retrieved = getStoredLicense()

      expect(retrieved).toEqual(state)
    })

    it('should return null if no license stored', () => {
      const retrieved = getStoredLicense()
      expect(retrieved).toBeNull()
    })
  })

  describe('clearStoredLicense()', () => {
    it('should remove license from both storages', () => {
      localStorageMock.setItem('raas_license_state', JSON.stringify({ isValid: true }))
      sessionStorage.setItem('raas_license_state', JSON.stringify({ isValid: true }))

      clearStoredLicense()

      expect(localStorageMock.getItem('raas_license_state')).toBeNull()
      expect(sessionStorage.getItem('raas_license_state')).toBeNull()
    })
  })

  describe('isLicenseValid()', () => {
    it('should return true for valid stored license', () => {
      localStorageMock.setItem(
        'raas_license_state',
        JSON.stringify({ isValid: true })
      )

      expect(isLicenseValid()).toBe(true)
    })

    it('should return false for invalid/missing license', () => {
      localStorageMock.setItem(
        'raas_license_state',
        JSON.stringify({ isValid: false })
      )

      expect(isLicenseValid()).toBe(false)
    })

    it('should return false when no license stored', () => {
      expect(isLicenseValid()).toBe(false)
    })
  })

  describe('validateAndStoreLicense()', () => {
    it('should validate and store license on success', async () => {
      const mockResponse = {
        isValid: true,
        tier: 'pro',
        status: 'active',
        features: { adminDashboard: true },
        daysRemaining: 365,
      }

      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response)

      const result = await validateAndStoreLicense('RAAS-TEST-KEY')

      expect(result.isValid).toBe(true)
      expect(getStoredLicense()?.isValid).toBe(true)
    })

    it('should not store on validation failure', async () => {
      vi.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid key' }),
      } as Response)

      await validateAndStoreLicense('INVALID-KEY')

      expect(getStoredLicense()?.isValid).toBeFalsy()
    })
  })

  describe('raasLicenseClient', () => {
    it('should export all client methods', () => {
      expect(raasLicenseClient.validateLicenseKey).toBeDefined()
      expect(raasLicenseClient.storeValidatedLicense).toBeDefined()
      expect(raasLicenseClient.getStoredLicense).toBeDefined()
      expect(raasLicenseClient.clearStoredLicense).toBeDefined()
      expect(raasLicenseClient.isLicenseValid).toBeDefined()
      expect(raasLicenseClient.validateAndStoreLicense).toBeDefined()
    })
  })
})

// ============================================================
// React Hook Tests
// ============================================================

describe('useRaaSLicense', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useRaaSLicense())

    expect(result.current.isLoading).toBe(false)
    expect(result.current.isValid).toBe(false)
    expect(result.current.tier).toBe('basic')
  })

  it('should load valid license from storage on mount', () => {
    localStorageMock.setItem(
      'raas_license_state',
      JSON.stringify({
        isValid: true,
        validation: {
          tier: 'premium',
          status: 'active',
          features: { adminDashboard: true },
          daysRemaining: 300,
        },
        source: 'local',
        validatedAt: Date.now(),
      })
    )

    const { result } = renderHook(() => useRaaSLicense({ autoValidate: true }))

    expect(result.current.isValid).toBe(true)
    expect(result.current.tier).toBe('premium')
  })

  it('should validate license successfully', async () => {
    const mockResponse = {
      isValid: true,
      tier: 'pro',
      status: 'active',
      features: { adminDashboard: true },
      daysRemaining: 365,
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    const { result } = renderHook(() => useRaaSLicense())

    await act(async () => {
      const success = await result.current.validateLicense('RAAS-TEST-KEY')
      expect(success).toBe(true)
    })

    expect(result.current.isValid).toBe(true)
    expect(result.current.tier).toBe('pro')
  })

  it('should handle validation failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid license' }),
    } as Response)

    const onError = vi.fn()
    const { result } = renderHook(() =>
      useRaaSLicense({ onError })
    )

    await act(async () => {
      const success = await result.current.validateLicense('INVALID-KEY')
      expect(success).toBe(false)
    })

    expect(result.current.isValid).toBe(false)
    expect(result.current.error).toBe('Invalid license')
    expect(onError).toHaveBeenCalledWith('Invalid license')
  })

  it('should clear license', () => {
    localStorageMock.setItem(
      'raas_license_state',
      JSON.stringify({ isValid: true })
    )

    const { result } = renderHook(() => useRaaSLicense())

    act(() => {
      result.current.clearLicense()
    })

    expect(result.current.isValid).toBe(false)
    expect(result.current.tier).toBe('basic')
  })

  it('should refresh license from storage', async () => {
    const { result } = renderHook(() => useRaaSLicense())

    // Initially no license
    expect(result.current.isValid).toBe(false)

    // Add license to storage
    localStorageMock.setItem(
      'raas_license_state',
      JSON.stringify({
        isValid: true,
        validation: { tier: 'enterprise', status: 'active', features: {} },
      })
    )

    // Refresh
    await act(async () => {
      await result.current.refreshLicense()
    })

    expect(result.current.isValid).toBe(true)
    expect(result.current.tier).toBe('enterprise')
  })

  it('should call onSuccess callback on validation success', async () => {
    const onSuccess = vi.fn()

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isValid: true, tier: 'basic', status: 'active', features: {} }),
    } as Response)

    const { result } = renderHook(() =>
      useRaaSLicense({ onSuccess })
    )

    await act(async () => {
      await result.current.validateLicense('RAAS-VALID-KEY')
    })

    expect(onSuccess).toHaveBeenCalled()
  })

  it('should handle requiredFeature check', () => {
    localStorageMock.setItem(
      'raas_license_state',
      JSON.stringify({
        isValid: true,
        validation: {
          tier: 'basic',
          status: 'active',
          features: { adminDashboard: false }, // Feature not available
        },
      })
    )

    const { result } = renderHook(() =>
      useRaaSLicense({ requiredFeature: 'adminDashboard' })
    )

    // Should be invalid because required feature is not available
    expect(result.current.isValid).toBe(false)
  })
})

// ============================================================
// Integration Tests
// ============================================================

describe('RaaS License Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('should complete full validation flow', async () => {
    const mockResponse = {
      isValid: true,
      tier: 'master',
      status: 'active',
      features: {
        adminDashboard: true,
        payosAutomation: true,
        premiumAgents: true,
      },
      daysRemaining: 999,
    }

    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response)

    // Step 1: Validate
    const result = await validateLicenseKey({
      licenseKey: 'RAAS-MASTER-KEY',
      mkApiKey: 'mk_master_key',
    })

    expect(result.isValid).toBe(true)
    expect(result.tier).toBe('master')

    // Step 2: Store
    storeValidatedLicense({
      isValid: true,
      licenseKey: 'RAAS-MASTER-KEY',
      validation: result,
    })

    // Step 3: Retrieve
    const stored = getStoredLicense()
    expect(stored?.isValid).toBe(true)
    expect(stored?.validation?.tier).toBe('master')

    // Step 4: Verify via hook
    const { result: hookResult } = renderHook(() => useRaaSLicense())
    await act(async () => {
      await hookResult.current.refreshLicense()
    })

    expect(hookResult.current.isValid).toBe(true)
  })

  it('should handle rate limiting from API', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: async () => ({ error: 'Rate limit exceeded' }),
    } as Response)

    const result = await validateLicenseKey({ licenseKey: 'TEST-KEY' })

    expect(result.isValid).toBe(false)
    expect(result.message).toBe('Rate limit exceeded')
  })
})

// ============================================================
// Edge Cases
// ============================================================

describe('Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
  })

  it('should handle empty license key', async () => {
    const result = await validateLicenseKey({ licenseKey: '' })
    expect(result.isValid).toBe(false)
  })

  it('should handle malformed license key', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid license format' }),
    } as Response)

    const result = await validateLicenseKey({ licenseKey: 'not-a-valid-format' })
    expect(result.isValid).toBe(false)
  })

  it('should handle timeout errors', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(
      new Error('Timeout: Request took too long')
    )

    const result = await validateLicenseKey({ licenseKey: 'RAAS-KEY' })
    expect(result.isValid).toBe(false)
    expect(result.message).toContain('Timeout')
  })

  it('should handle corrupted stored license', () => {
    localStorageMock.setItem('raas_license_state', 'invalid-json{{{')

    const stored = getStoredLicense()
    // Should handle gracefully and return null
    expect(stored).toBeNull()
  })

  it('should handle missing features object', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ isValid: true, tier: 'basic' }), // No features
    } as Response)

    const result = await validateLicenseKey({ licenseKey: 'RAAS-KEY' })
    expect(result.features).toEqual({})
  })
})
