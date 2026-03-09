/**
 * RaaS Alert Rules Engine - Unit Tests
 * Phase 6.4: Alerting Rules Engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
    raasAlertRules,
    RaasAlertRulesEngine,
    DEFAULT_ALERT_RULES,
    type AlertRuleConfig,
    type QuotaAlertInput,
    type SpendingAlertInput,
    type FeatureBlockInput,
} from '@/lib/raas-alert-rules';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
    supabase: {
        from: vi.fn(),
    },
}));

// Mock logger
vi.mock('@/utils/logger', () => ({
    analyticsLogger: {
        error: vi.fn(),
        info: vi.fn(),
        debug: vi.fn(),
    },
}));

describe('RaasAlertRulesEngine', () => {
    let engine: RaasAlertRulesEngine;
    const mockOrgId = 'org_test_123';

    beforeEach(() => {
        engine = new RaasAlertRulesEngine();
        vi.clearAllMocks();
    });

    describe('DEFAULT_ALERT_RULES', () => {
        it('should have 4 default rules', () => {
            expect(DEFAULT_ALERT_RULES).toHaveLength(4);
        });

        it('should include quota threshold rules', () => {
            const quotaRules = DEFAULT_ALERT_RULES.filter(
                rule => rule.rule_type === 'quota_threshold'
            );
            expect(quotaRules).toHaveLength(2);
            expect(quotaRules[0].threshold).toBe(90);
            expect(quotaRules[1].threshold).toBe(95);
        });

        it('should include spending limit rule', () => {
            const spendingRules = DEFAULT_ALERT_RULES.filter(
                rule => rule.rule_type === 'spending_limit'
            );
            expect(spendingRules).toHaveLength(1);
            expect(spendingRules[0].threshold).toBe(80);
        });

        it('should include feature blocked rule', () => {
            const featureRules = DEFAULT_ALERT_RULES.filter(
                rule => rule.rule_type === 'feature_blocked'
            );
            expect(featureRules).toHaveLength(1);
        });
    });

    describe('evaluateQuotaAlert', () => {
        it('should not trigger alert when usage is below threshold', async () => {
            const input: QuotaAlertInput = {
                orgId: mockOrgId,
                currentUsage: 5000,
                quotaLimit: 10000,
            };

            const result = await engine.evaluateQuotaAlert(input);

            expect(result.triggered).toBe(false);
            expect(result.currentValue).toBe(50); // 50%
        });

        it('should trigger warning alert at 90% usage', async () => {
            // Mock getRulesByType to return 90% threshold rule
            vi.spyOn(engine as any, 'getRulesByType').mockResolvedValue([
                {
                    id: 'rule-90',
                    org_id: mockOrgId,
                    rule_type: 'quota_threshold',
                    name: 'Quota 90% Warning',
                    severity: 'warning',
                    threshold: 90,
                    operator: 'gte' as const,
                    enabled: true,
                    message_template: 'Quota usage at {{percentage}}%',
                } as AlertRuleConfig,
            ]);

            vi.spyOn(engine as any, 'logAlertEvent').mockResolvedValue(undefined);

            const input: QuotaAlertInput = {
                orgId: mockOrgId,
                currentUsage: 9000,
                quotaLimit: 10000,
            };

            const result = await engine.evaluateQuotaAlert(input);

            expect(result.triggered).toBe(true);
            expect(result.rule?.name).toBe('Quota 90% Warning');
            expect(result.message).toContain('90');
        });

        it('should trigger critical alert at 95% usage', async () => {
            vi.spyOn(engine as any, 'getRulesByType').mockResolvedValue([
                {
                    id: 'rule-95',
                    org_id: mockOrgId,
                    rule_type: 'quota_threshold',
                    name: 'Quota 95% Critical',
                    severity: 'critical',
                    threshold: 95,
                    operator: 'gte' as const,
                    enabled: true,
                    message_template: 'Quota usage at {{percentage}}%',
                } as AlertRuleConfig,
            ]);

            vi.spyOn(engine as any, 'logAlertEvent').mockResolvedValue(undefined);

            const input: QuotaAlertInput = {
                orgId: mockOrgId,
                currentUsage: 9500,
                quotaLimit: 10000,
            };

            const result = await engine.evaluateQuotaAlert(input);

            expect(result.triggered).toBe(true);
            expect(result.rule?.severity).toBe('critical');
        });

        it('should handle zero quota limit gracefully', async () => {
            const input: QuotaAlertInput = {
                orgId: mockOrgId,
                currentUsage: 100,
                quotaLimit: 0,
            };

            const result = await engine.evaluateQuotaAlert(input);

            expect(result.triggered).toBe(false);
        });
    });

    describe('evaluateSpendingAlert', () => {
        it('should not trigger when spending is below limit', async () => {
            const input: SpendingAlertInput = {
                orgId: mockOrgId,
                currentSpending: 50,
                spendingLimit: 100,
            };

            const result = await engine.evaluateSpendingAlert(input);

            expect(result.triggered).toBe(false);
        });

        it('should trigger alert when spending exceeds 80% threshold', async () => {
            vi.spyOn(engine as any, 'getRulesByType').mockResolvedValue([
                {
                    id: 'rule-spending',
                    org_id: mockOrgId,
                    rule_type: 'spending_limit',
                    name: 'Spending 80% Warning',
                    severity: 'warning',
                    threshold: 80,
                    operator: 'gte' as const,
                    enabled: true,
                    message_template: 'Spending at {{percentage}}%',
                } as AlertRuleConfig,
            ]);

            vi.spyOn(engine as any, 'logAlertEvent').mockResolvedValue(undefined);

            const input: SpendingAlertInput = {
                orgId: mockOrgId,
                currentSpending: 85,
                spendingLimit: 100,
            };

            const result = await engine.evaluateSpendingAlert(input);

            expect(result.triggered).toBe(true);
            expect(result.currentValue).toBe(85);
        });
    });

    describe('evaluateFeatureBlock', () => {
        it('should not trigger when feature is not blocked', async () => {
            const input: FeatureBlockInput = {
                orgId: mockOrgId,
                featureName: 'premium_analytics',
                isBlocked: false,
            };

            const result = await engine.evaluateFeatureBlock(input);

            expect(result.triggered).toBe(false);
        });

        it('should trigger alert when feature is blocked', async () => {
            vi.spyOn(engine as any, 'getRulesByType').mockResolvedValue([
                {
                    id: 'rule-feature',
                    org_id: mockOrgId,
                    rule_type: 'feature_blocked',
                    name: 'Feature Blocked',
                    severity: 'info',
                    threshold: 1,
                    operator: 'eq' as const,
                    enabled: true,
                    message_template: 'Feature {{featureName}} blocked',
                } as AlertRuleConfig,
            ]);

            vi.spyOn(engine as any, 'logAlertEvent').mockResolvedValue(undefined);

            const input: FeatureBlockInput = {
                orgId: mockOrgId,
                featureName: 'premium_analytics',
                isBlocked: true,
                blockReason: 'quota_exceeded',
            };

            const result = await engine.evaluateFeatureBlock(input);

            expect(result.triggered).toBe(true);
            expect(result.message).toContain('premium_analytics');
        });
    });

    describe('evaluateThreshold', () => {
        it('should evaluate gte operator correctly', () => {
            const rule = { threshold: 90, operator: 'gte' as const };

            expect((engine as any).evaluateThreshold(90, rule)).toBe(true);
            expect((engine as any).evaluateThreshold(91, rule)).toBe(true);
            expect((engine as any).evaluateThreshold(89, rule)).toBe(false);
        });

        it('should evaluate gt operator correctly', () => {
            const rule = { threshold: 90, operator: 'gt' as const };

            expect((engine as any).evaluateThreshold(90, rule)).toBe(false);
            expect((engine as any).evaluateThreshold(91, rule)).toBe(true);
            expect((engine as any).evaluateThreshold(89, rule)).toBe(false);
        });

        it('should evaluate lte operator correctly', () => {
            const rule = { threshold: 90, operator: 'lte' as const };

            expect((engine as any).evaluateThreshold(90, rule)).toBe(true);
            expect((engine as any).evaluateThreshold(89, rule)).toBe(true);
            expect((engine as any).evaluateThreshold(91, rule)).toBe(false);
        });

        it('should evaluate eq operator correctly', () => {
            const rule = { threshold: 90, operator: 'eq' as const };

            expect((engine as any).evaluateThreshold(90, rule)).toBe(true);
            expect((engine as any).evaluateThreshold(91, rule)).toBe(false);
            expect((engine as any).evaluateThreshold(89, rule)).toBe(false);
        });
    });

    describe('formatMessage', () => {
        it('should replace template variables', () => {
            const template = 'Usage at {{percentage}}% for {{featureName}}';
            const variables = {
                percentage: '90',
                featureName: 'API Calls',
            };

            const result = (engine as any).formatMessage(template, variables);

            expect(result).toBe('Usage at 90% for API Calls');
        });

        it('should keep unchanged variables if key is missing', () => {
            const template = 'Usage at {{percentage}}% for {{featureName}}';
            const variables = {
                percentage: '90',
            };

            const result = (engine as any).formatMessage(template, variables);

            expect(result).toBe('Usage at 90% for {{featureName}}');
        });
    });

    describe('getAlertRules', () => {
        it('should return enabled rules for org', async () => {
            const mockRules = [
                {
                    id: 'rule-1',
                    org_id: mockOrgId,
                    rule_type: 'quota_threshold',
                    name: 'Quota Warning',
                    enabled: true,
                },
            ];

            const mockSelect = {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: mockRules, error: null }),
                    }),
                }),
            };

            const { supabase } = await import('@/lib/supabase');
            vi.mocked(supabase.from).mockReturnValue(mockSelect as any);

            const rules = await engine.getAlertRules(mockOrgId);

            expect(rules).toHaveLength(1);
            expect(rules[0].name).toBe('Quota Warning');
        });

        it('should handle database errors gracefully', async () => {
            const mockSelect = {
                select: vi.fn().mockReturnValue({
                    eq: vi.fn().mockReturnValue({
                        order: vi.fn().mockResolvedValue({ data: null, error: new Error('DB error') }),
                    }),
                }),
            };

            const { supabase } = await import('@/lib/supabase');
            vi.mocked(supabase.from).mockReturnValue(mockSelect as any);

            const rules = await engine.getAlertRules(mockOrgId);

            expect(rules).toHaveLength(0);
        });
    });

    describe('initializeDefaultRules', () => {
        it('should create default rules if none exist', async () => {
            vi.spyOn(engine, 'getAlertRules').mockResolvedValue([]);
            vi.spyOn(engine, 'createAlertRule').mockResolvedValue({ success: true, ruleId: 'new-rule' });

            await engine.initializeDefaultRules(mockOrgId);

            expect(engine.createAlertRule).toHaveBeenCalledTimes(4); // 4 default rules
        });

        it('should not create rules if they already exist', async () => {
            vi.spyOn(engine, 'getAlertRules').mockResolvedValue([
                { id: 'existing-rule' } as AlertRuleConfig,
            ]);
            vi.spyOn(engine, 'createAlertRule').mockResolvedValue({ success: true });

            await engine.initializeDefaultRules(mockOrgId);

            expect(engine.createAlertRule).not.toHaveBeenCalled();
        });
    });
});

describe('checkAlertRules convenience function', () => {
    it('should call evaluateQuotaAlert with correct parameters', async () => {
        const mockEvaluate = vi.spyOn(raasAlertRules, 'evaluateQuotaAlert').mockResolvedValue({
            triggered: false,
            currentValue: 50,
            threshold: 100,
        });

        await raasAlertRules.evaluateQuotaAlert({
            orgId: 'org_123',
            currentUsage: 5000,
            quotaLimit: 10000,
        });

        expect(mockEvaluate).toHaveBeenCalledWith({
            orgId: 'org_123',
            currentUsage: 5000,
            quotaLimit: 10000,
        });
    });
});
