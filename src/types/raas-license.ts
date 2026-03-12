/**
 * RaaS License Types
 */

export type LicenseTier = 'basic' | 'premium' | 'enterprise' | 'master';

export type LicenseStatus = 'active' | 'expired' | 'revoked' | 'pending' | 'suspended';

export interface LicenseQuota {
  apiCalls: number;
  tokens: number;
}

export interface RaaSLicense {
  id: string;
  license_key: string;
  user_id: string;
  status: LicenseStatus;
  tier: LicenseTier;
  features: {
    adminDashboard: boolean;
    payosWebhook: boolean;
    commissionDistribution: boolean;
    policyEngine: boolean;
  };
  quota: {
    apiCalls: number;
    tokens: number;
  };
  usage: {
    apiCalls: number;
    tokens: number;
  };
  suspension?: {
    isSuspended: boolean;
    suspendedAt?: string;
    reason?: string;
    suspendedBy?: string;
  };
  created_at: string;
  expires_at: string;
  metadata?: Record<string, unknown>;
}

export interface LicenseAuditLog {
  id: string;
  license_id: string;
  action: 'created' | 'activated' | 'expired' | 'revoked' | 'updated';
  old_status?: string;
  new_status?: string;
  metadata?: Record<string, unknown>;
  created_at: string;
  created_by?: string;
}

// Tier configuration with quota limits
export interface TierConfig {
  tier: LicenseTier;
  quotas: LicenseQuota;
  features: Record<string, boolean>;
  priceMonthly: number;
}

export const TIER_CONFIGS: Record<LicenseTier, TierConfig> = {
  basic: {
    tier: 'basic',
    quotas: { apiCalls: 10000, tokens: 100000 },
    features: { adminDashboard: true, payosWebhook: false, commissionDistribution: false, policyEngine: false },
    priceMonthly: 0,
  },
  premium: {
    tier: 'premium',
    quotas: { apiCalls: 50000, tokens: 500000 },
    features: { adminDashboard: true, payosWebhook: true, commissionDistribution: true, policyEngine: false },
    priceMonthly: 49,
  },
  enterprise: {
    tier: 'enterprise',
    quotas: { apiCalls: 200000, tokens: 2000000 },
    features: { adminDashboard: true, payosWebhook: true, commissionDistribution: true, policyEngine: true },
    priceMonthly: 149,
  },
  master: {
    tier: 'master',
    quotas: { apiCalls: 1000000, tokens: 10000000 },
    features: { adminDashboard: true, payosWebhook: true, commissionDistribution: true, policyEngine: true },
    priceMonthly: 499,
  },
};

export const STATUS_COLORS: Record<LicenseStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  revoked: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  suspended: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const TIER_COLORS: Record<LicenseTier, string> = {
  basic: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  premium: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  enterprise: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  master: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};
