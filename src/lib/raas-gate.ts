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
    tier: 'free' | 'pro' | 'agency';
    features: Record<string, boolean>;
    expiresAt?: number;
}

// Module-level cache for license validation result
let cachedResult: LicenseValidationResult | null = null;

/**
 * Validate RaaS license key
 */
export function validateRaaSLicense(key?: string): LicenseValidationResult {
    const licenseKey = key || RAAS_LICENSE_KEY;

    if (!licenseKey) {
        return {
            isValid: false,
            tier: 'free',
            features: {
                adminDashboard: false,
                payosAutomation: false,
                premiumAgents: false,
                advancedAnalytics: false,
            },
        };
    }

    const licensePattern = /^RAAS-\d{10}-[A-Z0-9]{6,}$/;
    const isValidFormat = licensePattern.test(licenseKey);
    if (!isValidFormat) {
        return {
            isValid: false,
            tier: 'free',
            features: {
                adminDashboard: false,
                payosAutomation: false,
                premiumAgents: false,
                advancedAnalytics: false,
            },
        };
    }

    return {
        isValid: true,
        tier: 'agency',
        features: {
            adminDashboard: true,
            payosAutomation: true,
            premiumAgents: true,
            advancedAnalytics: true,
        },
        expiresAt: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
    };
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
