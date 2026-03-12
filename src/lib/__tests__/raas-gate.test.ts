/**
 * Tests for RaaS License Gate - ROIaaS Phase 1
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
    validateRaaSLicense,
    checkLicense,
    isFreeTier,
    isPremiumTier,
    hasFeature,
    clearLicenseCache,
} from '../raas-gate';

// Test license keys with valid hex format (only 0-9, a-f)
const TEST_KEYS = {
    basic: 'raas_basic_1234567890_abcdef0123456789_abcdef0123456789',
    premium: 'raas_premium_1234567890_abcdef0123456789_abcdef0123456789',
    enterprise: 'raas_enterprise_1234567890_abcdef0123456789_abcdef0123456789',
    master: 'raas_master_1234567890_abcdef0123456789_abcdef0123456789',
    old_format: 'RAAS-1234567890-ABCD1234',
    invalid: 'invalid-key',
};

describe('RaaS License Gate', () => {
    beforeEach(() => {
        clearLicenseCache();
    });

    describe('validateRaaSLicense', () => {
        it('should return invalid for missing license key', () => {
            const result = validateRaaSLicense('');
            expect(result.isValid).toBe(false);
            expect(result.tier).toBe('basic');
            expect(result.status).toBe('expired');
        });

        it('should return invalid for malformed license key', () => {
            const result = validateRaaSLicense(TEST_KEYS.invalid);
            expect(result.isValid).toBe(false);
            expect(result.status).toBe('revoked');
        });

        it('should validate old format license key (RAAS-*)', () => {
            const result = validateRaaSLicense(TEST_KEYS.old_format);
            expect(result.isValid).toBe(true);
            expect(result.tier).toBe('premium');
            expect(result.status).toBe('active');
        });

        it('should validate new format license key with basic tier', () => {
            const result = validateRaaSLicense(TEST_KEYS.basic);
            expect(result.isValid).toBe(true);
            expect(result.tier).toBe('basic');
        });

        it('should validate new format license key with premium tier', () => {
            const result = validateRaaSLicense(TEST_KEYS.premium);
            expect(result.isValid).toBe(true);
            expect(result.tier).toBe('premium');
        });

        it('should validate new format license key with enterprise tier', () => {
            const result = validateRaaSLicense(TEST_KEYS.enterprise);
            expect(result.isValid).toBe(true);
            expect(result.tier).toBe('enterprise');
        });

        it('should validate new format license key with master tier', () => {
            const result = validateRaaSLicense(TEST_KEYS.master);
            expect(result.isValid).toBe(true);
            expect(result.tier).toBe('master');
        });
    });

    describe('feature access by tier', () => {
        it('basic tier should have adminDashboard but not payosAutomation', () => {
            const result = validateRaaSLicense(TEST_KEYS.basic);
            expect(result.features.adminDashboard).toBe(true);
            expect(result.features.payosAutomation).toBe(false);
            expect(result.features.premiumAgents).toBe(false);
        });

        it('premium tier should have adminDashboard and payosAutomation', () => {
            const result = validateRaaSLicense(TEST_KEYS.premium);
            expect(result.features.adminDashboard).toBe(true);
            expect(result.features.payosAutomation).toBe(true);
            expect(result.features.premiumAgents).toBe(false);
        });

        it('enterprise tier should have all features', () => {
            const result = validateRaaSLicense(TEST_KEYS.enterprise);
            expect(result.features.adminDashboard).toBe(true);
            expect(result.features.payosAutomation).toBe(true);
            expect(result.features.premiumAgents).toBe(true);
            expect(result.features.advancedAnalytics).toBe(true);
        });
    });

    describe('checkLicense', () => {
        it('should return same result as validateRaaSLicense', () => {
            const validated = validateRaaSLicense(TEST_KEYS.premium);
            const checked = checkLicense(TEST_KEYS.premium);
            expect(checked.isValid).toBe(validated.isValid);
            expect(checked.tier).toBe(validated.tier);
        });
    });

    describe('isFreeTier', () => {
        it('should return true for invalid license', () => {
            expect(isFreeTier('')).toBe(true);
            expect(isFreeTier(TEST_KEYS.invalid)).toBe(true);
        });

        it('should return true for basic tier', () => {
            expect(isFreeTier(TEST_KEYS.basic)).toBe(true);
        });

        it('should return false for premium tier', () => {
            expect(isFreeTier(TEST_KEYS.premium)).toBe(false);
        });
    });

    describe('isPremiumTier', () => {
        it('should return false for invalid license', () => {
            expect(isPremiumTier('')).toBe(false);
        });

        it('should return false for basic tier', () => {
            expect(isPremiumTier(TEST_KEYS.basic)).toBe(false);
        });

        it('should return true for premium tier', () => {
            expect(isPremiumTier(TEST_KEYS.premium)).toBe(true);
        });

        it('should return true for enterprise tier', () => {
            expect(isPremiumTier(TEST_KEYS.enterprise)).toBe(true);
        });

        it('should return true for master tier', () => {
            expect(isPremiumTier(TEST_KEYS.master)).toBe(true);
        });
    });

    describe('hasFeature', () => {
        it('should return true for basic tier with adminDashboard', () => {
            expect(hasFeature('adminDashboard', TEST_KEYS.basic)).toBe(true);
        });

        it('should return false for basic tier with payosAutomation', () => {
            expect(hasFeature('payosAutomation', TEST_KEYS.basic)).toBe(false);
        });

        it('should return true for premium tier with payosAutomation', () => {
            expect(hasFeature('payosAutomation', TEST_KEYS.premium)).toBe(true);
        });

        it('should return false for invalid license', () => {
            expect(hasFeature('adminDashboard', '')).toBe(false);
        });
    });
});
