/**
 * RaaS License Gate - ROIaaS Phase 1
 * Gate premium features behind license key validation
 */

const RAAS_LICENSE_KEY = import.meta.env.VITE_RAAS_LICENSE_KEY;

export interface LicenseValidationResult {
    isValid: boolean;
    tier: 'free' | 'pro' | 'agency';
    features: Record<string, boolean>;
}

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

    const licensePattern = /^RAAS-\d+-[A-Z0-9]+$/;
    if (!licensePattern.test(licenseKey)) {
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
    };
}

export function hasFeature(feature: string, key?: string): boolean {
    const result = validateRaaSLicense(key);
    return result.features[feature] || false;
}
