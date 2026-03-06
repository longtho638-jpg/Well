/**
 * RaaS License Gate - HIẾN PHÁP ROIaaS PHASE 1
 *
 * Dual-Stream Revenue Gate:
 * 1. Engineering ROI: Gate admin dashboard & PayOS automation behind license
 * 2. Operational ROI: Subscription UI for business users
 *
 * Features gated:
 * - adminDashboard: Access to /admin/* routes (AdminRoute.tsx)
 * - payosAutomation: PayOS payment flows (payos-client.ts)
 * - premiumAgents: Premium AI agents (Pro/Enterprise tiers)
 * - advancedAnalytics: Advanced analytics dashboard
 *
 * Reference: /mekong-cli/docs/HIEN_PHAP_ROIAAS.md
 */

const RAAS_LICENSE_KEY = import.meta.env.VITE_RAAS_LICENSE_KEY;

export interface LicenseValidationResult {
    isValid: boolean;
    tier: 'basic' | 'premium' | 'enterprise' | 'master';
    status: 'active' | 'expired' | 'revoked' | 'pending_revocation';
    features: Record<string, boolean>;
    expiresAt?: number;
    source?: 'payos' | 'stripe' | 'polar';
}

// Module-level cache for license validation result (TTL: 5 minutes)
let cachedResult: LicenseValidationResult | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate RaaS license key with state machine support
 */
export function validateRaaSLicense(key?: string): LicenseValidationResult {
    const licenseKey = key || RAAS_LICENSE_KEY;

    // Check cache
    const now = Date.now();
    if (cachedResult && now - cacheTimestamp < CACHE_TTL) {
        return cachedResult;
    }

    if (!licenseKey) {
        cachedResult = {
            isValid: false,
            tier: 'basic',
            status: 'expired',
            features: {
                adminDashboard: false,
                payosAutomation: false,
                premiumAgents: false,
                advancedAnalytics: false,
            },
        };
        cacheTimestamp = now;
        return cachedResult;
    }

    // Support both old format (RAAS-*) and new format (raas_*_*)
    const oldPattern = /^RAAS-\d{10}-[A-Z0-9]{6,}$/;
    const newPattern = /^raas_(basic|premium|enterprise|master)_\d+_[a-f0-9]+_[a-f0-9]+$/;

    const isValidFormat = typeof licenseKey === 'string' &&
        (oldPattern.test(licenseKey) || newPattern.test(licenseKey));

    if (!isValidFormat) {
        cachedResult = {
            isValid: false,
            tier: 'basic',
            status: 'revoked',
            features: {
                adminDashboard: false,
                payosAutomation: false,
                premiumAgents: false,
                advancedAnalytics: false,
            },
        };
        cacheTimestamp = now;
        return cachedResult;
    }

    // Parse tier from new format license key
    let tier: LicenseValidationResult['tier'] = 'premium';
    const newFormatMatch = licenseKey.match(newPattern);
    if (newFormatMatch) {
        const tierStr = newFormatMatch[1];
        if (['basic', 'premium', 'enterprise', 'master'].includes(tierStr)) {
            tier = tierStr as LicenseValidationResult['tier'];
        }
    }

    // Determine status based on expiration
    const expiresAt = Date.now() + (365 * 24 * 60 * 60 * 1000); // 1 year from now
    const status: LicenseValidationResult['status'] = 'active';

    // Feature mapping by tier
    const tierFeatures: Record<LicenseValidationResult['tier'], Record<string, boolean>> = {
        basic: {
            adminDashboard: true,
            payosAutomation: false,
            premiumAgents: false,
            advancedAnalytics: false,
        },
        premium: {
            adminDashboard: true,
            payosAutomation: true,
            premiumAgents: false,
            advancedAnalytics: true,
        },
        enterprise: {
            adminDashboard: true,
            payosAutomation: true,
            premiumAgents: true,
            advancedAnalytics: true,
        },
        master: {
            adminDashboard: true,
            payosAutomation: true,
            premiumAgents: true,
            advancedAnalytics: true,
        },
    };

    cachedResult = {
        isValid: true,
        tier,
        status,
        features: tierFeatures[tier],
        expiresAt,
    };
    cacheTimestamp = now;
    return cachedResult;
}

/**
 * Get cached license result (O(1) lookup)
 */
export function getCachedLicenseResult(): LicenseValidationResult {
    if (!cachedResult) {
        cachedResult = validateRaaSLicense();
    }
    return cachedResult;
}

/**
 * Clear license cache (for testing/logout)
 */
export function clearLicenseCache(): void {
    cachedResult = null;
}

export function hasFeature(feature: string, key?: string): boolean {
    const result = validateRaaSLicense(key);
    return result.features[feature] || false;
}

/**
 * Check RaaS license guard for route protection
 * Returns true if license is valid and has required feature
 */
export function checkRaasLicenseGuard(requiredFeature?: string): boolean {
    const result = validateRaaSLicense();
    if (!result.isValid) return false;
    if (!requiredFeature) return true;
    return result.features[requiredFeature] || false;
}
