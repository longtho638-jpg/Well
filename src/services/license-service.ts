/**
 * License Service - RaaS License Management
 *
 * Client-side service for license operations.
 * Uses Supabase for database operations.
 */

import { createClient } from '@supabase/supabase-js';
import { validateLicenseFormat, getDaysRemaining } from '@/lib/raas-gate-utils';
import type {
  LicenseRecord,
  LicenseActivationRequest,
  LicenseValidationResponse,
  LicenseTier,
} from './license-types';
import type { TierConfig } from '@/types/raas-license';
import { TIER_CONFIGS } from '@/types/raas-license';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder';

function createLicenseClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Validate license key format (client-side quick check)
 */
export function validateLicenseKeyQuick(licenseKey: string): { valid: boolean; error?: string } {
  if (!licenseKey || licenseKey.trim().length === 0) {
    return { valid: false, error: 'License key is required' };
  }
  if (!validateLicenseFormat(licenseKey)) {
    return { valid: false, error: 'Invalid license key format. Expected: RAAS-XXXXXXXXXX-hash' };
  }
  return { valid: true };
}

/**
 * Generate license key with tier-based format
 * Format: raas_(tier)_(timestamp)_(hex)_(hex)
 */
export function generateLicenseKey(userId: string, tier: LicenseTier = 'basic', features: string[] = []): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const hashInput = `${userId}-${tier}-${timestamp}-${features.join('-')}`;
  let hash = 0;
  let hash2 = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
    hash2 = ((hash2 << 7) - hash2) + char * (i + 1);
    hash2 = hash2 & hash2;
  }
  const hashStr1 = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
  const hashStr2 = Math.abs(hash2).toString(36).toUpperCase().padStart(6, '0');
  return `raas_${tier}_${timestamp}_${hashStr1}_${hashStr2}`;
}

/**
 * Get tier configuration
 */
export function getTierConfig(tier: LicenseTier): TierConfig {
  return TIER_CONFIGS[tier as keyof typeof TIER_CONFIGS];
}

/**
 * Activate license via PayOS subscription payment
 */
export async function activateLicenseViaPayOS(request: LicenseActivationRequest): Promise<LicenseValidationResponse> {
  try {
    const supabase = createLicenseClient();
    const { data: existing } = await supabase
      .from('raas_licenses')
      .select('*')
      .eq('license_key', request.licenseKey)
      .single();

    if (existing) {
      return {
        isValid: existing.status === 'active',
        license: existing,
        features: existing.features,
        error: existing.status === 'expired' ? 'License expired' :
               existing.status === 'revoked' ? 'License revoked' :
               'License already activated',
      };
    }

    const timestamp = parseInt(request.licenseKey.split('-')[1], 10);
    const expiresAt = new Date(timestamp + (365 * 24 * 60 * 60 * 1000)).toISOString();

    const { data: newLicense, error } = await supabase
      .from('raas_licenses')
      .insert({
        license_key: request.licenseKey,
        user_id: request.userId,
        status: 'active',
        features: { adminDashboard: true, payosWebhook: true, commissionDistribution: true, policyEngine: true },
        expires_at: expiresAt,
        metadata: { payment_reference: request.paymentReference, activated_via: 'payos_subscription' },
      })
      .select()
      .single();

    if (error) throw error;

    return { isValid: true, license: newLicense, features: newLicense.features, daysRemaining: getDaysRemaining(timestamp) };
  } catch (error) {
    // License activation error
    return {
      isValid: false,
      features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      error: (error as Error).message || 'Failed to activate license',
    };
  }
}

/**
 * Validate license from database
 */
export async function validateLicenseFromDB(licenseKey: string): Promise<LicenseValidationResponse> {
  try {
    const supabase = createLicenseClient();
    const { data: license, error } = await supabase
      .from('raas_licenses')
      .select('*')
      .eq('license_key', licenseKey)
      .single();

    if (error || !license) {
      return {
        isValid: false,
        features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
        error: 'License not found',
      };
    }

    if (license.status !== 'active') {
      return { isValid: false, license, features: license.features, error: `License ${license.status}` };
    }

    const expiresAt = new Date(license.expires_at).getTime();
    if (Date.now() > expiresAt) {
      await supabase.from('raas_licenses').update({ status: 'expired' }).eq('id', license.id);
      return { isValid: false, license, features: license.features, error: 'License expired' };
    }

    const daysRemaining = Math.floor((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return { isValid: true, license, features: license.features, daysRemaining };
  } catch (error) {
    // License validation error
    return {
      isValid: false,
      features: { adminDashboard: false, payosWebhook: false, commissionDistribution: false, policyEngine: false },
      error: (error as Error).message || 'Validation failed',
    };
  }
}

/**
 * Revoke license (admin action)
 */
export async function revokeLicense(licenseKey: string, reason: string): Promise<boolean> {
  try {
    const supabase = createLicenseClient();
    const { error } = await supabase
      .from('raas_licenses')
      .update({ status: 'revoked', metadata: { revoked_reason: reason, revoked_at: new Date().toISOString() } })
      .eq('license_key', licenseKey);
    return !error;
  } catch {
    // License revocation error
    return false;
  }
}

/**
 * Get user's active license
 */
export async function getUserLicense(userId: string): Promise<LicenseRecord | null> {
  try {
    const supabase = createLicenseClient();
    const { data, error } = await supabase
      .from('raas_licenses')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (error || !data) return null;
    return data;
  } catch {
    // Get user license error
    return null;
  }
}

/**
 * Suspend license (admin action)
 */
export async function suspendLicense(
  licenseId: string,
  reason: string,
  suspendedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createLicenseClient();
    const { error } = await supabase
      .from('raas_licenses')
      .update({
        is_suspended: true,
        suspended_at: new Date().toISOString(),
        suspended_reason: reason,
        suspended_by: suspendedBy,
      })
      .eq('id', licenseId);

    if (error) throw error;

    // Log suspension in audit log
    await supabase.from('raas_license_audit_logs').insert({
      license_id: licenseId,
      action: 'updated',
      metadata: {
        suspension: {
          suspended: true,
          reason,
          suspended_by: suspendedBy,
          suspended_at: new Date().toISOString(),
        },
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Unsuspend license (admin action)
 */
export async function unsuspendLicense(licenseId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createLicenseClient();
    const { error } = await supabase
      .from('raas_licenses')
      .update({
        is_suspended: false,
        suspended_at: null,
        suspended_reason: null,
        suspended_by: null,
      })
      .eq('id', licenseId);

    if (error) throw error;

    // Log unsuspension in audit log
    await supabase.from('raas_license_audit_logs').insert({
      license_id: licenseId,
      action: 'updated',
      metadata: { suspension: { suspended: false } },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update license tier
 */
export async function updateLicenseTier(
  licenseId: string,
  newTier: LicenseTier
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createLicenseClient();
    const tierConfig = getTierConfig(newTier);

    const { error } = await supabase
      .from('raas_licenses')
      .update({
        tier: newTier,
        quota_api_calls: tierConfig.quotas.apiCalls,
        quota_tokens: tierConfig.quotas.tokens,
        features: tierConfig.features,
      })
      .eq('id', licenseId);

    if (error) throw error;

    // Log tier change in audit log
    await supabase.from('raas_license_audit_logs').insert({
      license_id: licenseId,
      action: 'updated',
      metadata: {
        tier_change: {
          from: 'unknown',
          to: newTier,
          new_quotas: tierConfig.quotas,
        },
      },
    });

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get license usage (quota utilization)
 */
export async function getLicenseUsage(licenseId: string): Promise<{
  success: boolean;
  usage?: {
    apiCalls: { used: number; quota: number; percentage: number };
    tokens: { used: number; quota: number; percentage: number };
  };
  error?: string;
}> {
  try {
    const supabase = createLicenseClient();
    const { data, error } = await supabase
      .from('raas_licenses')
      .select('quota_api_calls, quota_tokens, used_api_calls, used_tokens')
      .eq('id', licenseId)
      .single();

    if (error) throw error;

    const apiCallsPercentage =
      data.quota_api_calls > 0
        ? Math.round((data.used_api_calls / data.quota_api_calls) * 100)
        : 0;
    const tokensPercentage =
      data.quota_tokens > 0
        ? Math.round((data.used_tokens / data.quota_tokens) * 100)
        : 0;

    return {
      success: true,
      usage: {
        apiCalls: {
          used: data.used_api_calls || 0,
          quota: data.quota_api_calls || 0,
          percentage: apiCallsPercentage,
        },
        tokens: {
          used: data.used_tokens || 0,
          quota: data.quota_tokens || 0,
          percentage: tokensPercentage,
        },
      },
    };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Update license usage (called after API calls)
 * Note: Requires database function increment_license_usage or direct column update
 */
export async function updateLicenseUsage(
  licenseId: string,
  apiCallsUsed: number,
  tokensUsed: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createLicenseClient();

    // Get current usage first
    const { data: current } = await supabase
      .from('raas_licenses')
      .select('used_api_calls, used_tokens')
      .eq('id', licenseId)
      .single();

    if (!current) {
      return { success: false, error: 'License not found' };
    }

    // Increment usage
    const { error } = await supabase
      .from('raas_licenses')
      .update({
        used_api_calls: (current.used_api_calls || 0) + apiCallsUsed,
        used_tokens: (current.used_tokens || 0) + tokensUsed,
      })
      .eq('id', licenseId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Parse tier from license key
 */
export function parseTierFromLicenseKey(licenseKey: string): LicenseTier | null {
  // Format: raas_(tier)_(timestamp)_(hex)_(hex)
  const parts = licenseKey.split('_');
  if (parts.length >= 2) {
    const tier = parts[1] as LicenseTier;
    if (['basic', 'premium', 'enterprise', 'master'].includes(tier)) {
      return tier;
    }
  }
  return null;
}
