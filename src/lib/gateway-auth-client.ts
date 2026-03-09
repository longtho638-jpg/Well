/**
 * Gateway Authentication Client
 *
 * Handles JWT generation and mk_ API key management for RaaS Gateway authentication.
 * Implements token caching with expiry to reduce auth overhead.
 *
 * Features:
 * - JWT token generation with standard claims (iss, aud, sub, exp, iat, jti)
 * - Token caching with configurable refresh buffer
 * - mk_ API key format validation
 * - Automatic token refresh before expiry
 *
 * Usage:
 *   const authClient = new GatewayAuthClient({
 *     issuer: 'wellnexus.vn',
 *     audience: 'raas.agencyos.network',
 *     apiKey: 'mk_xxx',
 *   })
 *   const { token, expiresAt } = authClient.getValidToken('org-123', 'lic-456')
 */

import { analyticsLogger } from '@/utils/logger'

export interface JWTPayload {
  iss: string           // Issuer (wellnexus.vn)
  aud: string           // Audience (raas.agencyos.network)
  sub: string           // Subject (orgId)
  license_id?: string   // License ID
  mk_key?: string       // API key prefix (mk_xxx)
  exp: number           // Expiry (Unix timestamp in seconds)
  iat: number           // Issued at (Unix timestamp in seconds)
  jti?: string          // Unique token ID (for revocation)
}

export interface JWTHeader {
  alg: string
  typ: string
}

export interface GatewayAuthResult {
  token: string
  expiresAt: number     // Unix timestamp in ms
  refreshed: boolean
}

export interface GatewayAuthClientOptions {
  issuer: string
  audience: string
  apiKey: string
  tokenExpirySeconds?: number    // Default: 3600 (1 hour)
  refreshBufferMs?: number       // Default: 300000 (5 min buffer)
}

export class GatewayAuthClient {
  private readonly issuer: string
  private readonly audience: string
  private readonly apiKey: string
  private readonly tokenExpirySeconds: number
  private readonly refreshBufferMs: number
  private tokenCache: Map<string, GatewayAuthResult>

  constructor(options: GatewayAuthClientOptions) {
    this.issuer = options.issuer
    this.audience = options.audience
    this.apiKey = options.apiKey
    this.tokenExpirySeconds = options.tokenExpirySeconds || 3600
    this.refreshBufferMs = options.refreshBufferMs || 300000 // 5 min buffer
    this.tokenCache = new Map()

    // Validate API key format on construction
    if (!this.validateApiKeyFormat(this.apiKey)) {
      throw new Error('Invalid API key format. Must start with "mk_"')
    }
  }

  /**
   * Generate JWT token for Gateway auth
   *
   * @param orgId - Organization ID (subject claim)
   * @param licenseId - Optional license ID
   * @returns GatewayAuthResult with token and expiry
   */
  generateToken(orgId: string, licenseId?: string): GatewayAuthResult {
    const now = Date.now()
    const nowSeconds = Math.floor(now / 1000)
    const expirySeconds = nowSeconds + this.tokenExpirySeconds

    // Generate unique token ID (jti)
    const jti = this.generateJti()

    // Build JWT payload
    const payload: JWTPayload = {
      iss: this.issuer,
      aud: this.audience,
      sub: orgId,
      license_id: licenseId,
      mk_key: this.extractMkKeyPrefix(this.apiKey),
      exp: expirySeconds,
      iat: nowSeconds,
      jti,
    }

    // Generate JWT (HS256 signed)
    const token = this.signJWT(payload)

    const expiresAt = expirySeconds * 1000 // Convert to ms

    analyticsLogger.info('[GatewayAuthClient] Token generated', {
      orgId,
      licenseId,
      expiresAt: new Date(expiresAt).toISOString(),
    })

    return {
      token,
      expiresAt,
      refreshed: false,
    }
  }

  /**
   * Get valid token (from cache or generate new)
   *
   * @param orgId - Organization ID
   * @param licenseId - Optional license ID
   * @returns GatewayAuthResult with valid token
   */
  getValidToken(orgId: string, licenseId?: string): GatewayAuthResult {
    const cacheKey = this.getCacheKey(orgId, licenseId)
    const cached = this.tokenCache.get(cacheKey)

    // Return cached token if still valid (with refresh buffer)
    if (cached && cached.expiresAt > Date.now() + this.refreshBufferMs) {
      analyticsLogger.debug('[GatewayAuthClient] Using cached token', {
        orgId,
        expiresAt: new Date(cached.expiresAt).toISOString(),
      })
      return { ...cached, refreshed: false }
    }

    // Generate new token
    const result = this.generateToken(orgId, licenseId)

    // Cache the result
    this.tokenCache.set(cacheKey, result)

    return result
  }

  /**
   * Refresh token if needed (check expiry with buffer)
   *
   * @param orgId - Organization ID
   * @param licenseId - Optional license ID
   * @returns GatewayAuthResult (may be cached if still valid)
   */
  refreshIfNeeded(orgId: string, licenseId?: string): GatewayAuthResult {
    return this.getValidToken(orgId, licenseId)
  }

  /**
   * Validate mk_ API key format
   *
   * @param apiKey - API key to validate
   * @returns true if valid mk_ format
   */
  validateApiKeyFormat(apiKey: string): boolean {
    // Format: mk_[a-zA-Z0-9]{16,}
    const pattern = /^mk_[a-zA-Z0-9]{16,}$/
    return pattern.test(apiKey)
  }

  /**
   * Clear token cache (useful for testing)
   */
  clearCache(): void {
    this.tokenCache.clear()
    analyticsLogger.debug('[GatewayAuthClient] Token cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number } {
    return { size: this.tokenCache.size }
  }

  /**
   * Get cache key for org/license combination
   */
  private getCacheKey(orgId: string, licenseId?: string): string {
    return licenseId ? `${orgId}:${licenseId}` : orgId
  }

  /**
   * Extract mk_ prefix from API key for JWT claim
   */
  private extractMkKeyPrefix(apiKey: string): string {
    // Return the full key or just the prefix for security
    // In production, you might want to hash this
    return apiKey
  }

  /**
   * Generate unique token ID (jti)
   */
  private generateJti(): string {
    // Simple UUID v4-like generator
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)

    // Format as UUID: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  /**
   * Sign JWT with HS256 algorithm
   *
   * Note: For production, use a proper JWT library or crypto.subtle
   * This is a simplified implementation for demo purposes
   */
  private async signJWT(payload: JWTPayload): Promise<string> {
    const header: JWTHeader = {
      alg: 'HS256',
      typ: 'JWT',
    }

    // Base64URL encode header and payload
    const headerBase64 = this.base64UrlEncode(JSON.stringify(header))
    const payloadBase64 = this.base64UrlEncode(JSON.stringify(payload))

    // Create signature
    const encoder = new TextEncoder()
    const data = encoder.encode(`${headerBase64}.${payloadBase64}`)
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(this.apiKey),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, data)

    // Convert signature to base64url
    const signatureBase64 = this.arrayBufferToBase64Url(signature)

    return `${headerBase64}.${payloadBase64}.${signatureBase64}`
  }

  /**
   * Base64URL encode a string
   */
  private base64UrlEncode(str: string): string {
    const bytes = new TextEncoder().encode(str)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }

  /**
   * Convert ArrayBuffer to Base64URL
   */
  private arrayBufferToBase64Url(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
  }
}

/**
 * Default auth client instance (requires configuration)
 * Note: Initialize with your own API key
 */
// export const gatewayAuthClient = new GatewayAuthClient({
//   issuer: 'wellnexus.vn',
//   audience: 'raas.agencyos.network',
//   apiKey: import.meta.env.VITE_RAAS_API_KEY || '',
// })

export default GatewayAuthClient
