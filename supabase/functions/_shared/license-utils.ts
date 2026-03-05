/**
 * License Validation Utilities
 */

export interface LicenseFeatures {
  adminDashboard: boolean
  payosWebhook: boolean
  commissionDistribution: boolean
  policyEngine: boolean
}

export interface RateLimitEntry {
  count: number
  windowStart: number
}

/**
 * Get client IP from request headers
 */
export function getClientIP(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         req.headers.get('x-real-ip') ||
         'unknown'
}

/**
 * Check rate limit for client IP
 */
export function checkRateLimit(
  clientIP: string,
  rateLimitMap: Map<string, RateLimitEntry>,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(clientIP)

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(clientIP, { count: 1, windowStart: now })
    return { allowed: true, remaining: maxRequests - 1 }
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 }
  }

  entry.count++
  return { allowed: true, remaining: maxRequests - entry.count }
}

/**
 * Get CORS headers based on origin
 */
export function getCorsHeaders(req: Request, allowedOrigins: string[]): Record<string, string> {
  const origin = req.headers.get('Origin') || ''
  const allowedOrigin = allowedOrigins.includes(origin) ? origin : allowedOrigins[0]

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, content-type, x-api-key',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

/**
 * Validate license key format strictly
 */
export function validateLicenseFormat(licenseKey: string): { valid: boolean; error?: string } {
  const LICENSE_PATTERN = /^RAAS-\d{10}-[a-zA-Z0-9]{6,}$/
  const LICENSE_HASH_MIN_LENGTH = 6

  if (typeof licenseKey !== 'string') {
    return { valid: false, error: 'licenseKey must be a string' }
  }

  if (licenseKey.length < 20 || licenseKey.length > 100) {
    return { valid: false, error: 'licenseKey length must be between 20 and 100 characters' }
  }

  if (!LICENSE_PATTERN.test(licenseKey)) {
    return { valid: false, error: 'Invalid license format' }
  }

  const parts = licenseKey.split('-')
  if (parts.length !== 3) {
    return { valid: false, error: 'License must have 3 parts separated by hyphens' }
  }

  const hash = parts[2]
  if (hash.length < LICENSE_HASH_MIN_LENGTH) {
    return { valid: false, error: 'License hash must be at least 6 characters' }
  }

  return { valid: true }
}

/**
 * Validate and sanitize features from database
 */
export function validateAndSanitizeFeatures(features: unknown): LicenseFeatures {
  const defaultFeatures: LicenseFeatures = {
    adminDashboard: false,
    payosWebhook: false,
    commissionDistribution: false,
    policyEngine: false,
  }

  if (!features || typeof features !== 'object') {
    return defaultFeatures
  }

  const f = features as Record<string, unknown>
  return {
    adminDashboard: f.adminDashboard === true,
    payosWebhook: f.payosWebhook === true,
    commissionDistribution: f.commissionDistribution === true,
    policyEngine: f.policyEngine === true,
  }
}

/**
 * Mask license key for audit logs
 */
export function maskLicenseKey(licenseKey: string): string {
  if (licenseKey.length <= 8) return '***'
  return licenseKey.slice(0, 10) + '...' + licenseKey.slice(-4)
}
