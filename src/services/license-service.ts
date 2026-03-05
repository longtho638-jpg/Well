/**
 * License Service - RaaS License Management
 *
 * Client-side service for license operations.
 * Uses Supabase for database operations.
 */

import { createClient } from '@supabase/supabase-js';
import { validateLicenseFormat, getDaysRemaining } from '@/lib/raas-gate-utils';
import type { LicenseRecord, LicenseActivationRequest, LicenseValidationResponse } from './license-types';

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
 * Generate license key from timestamp
 * Format: RAAS-{timestamp}-{hash}
 */
export function generateLicenseKey(userId: string, features: string[] = []): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const hashInput = `${userId}-${timestamp}-${features.join('-')}`;
  let hash = 0;
  for (let i = 0; i < hashInput.length; i++) {
    const char = hashInput.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const hashStr = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
  return `RAAS-${timestamp}-${hashStr}`;
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
    console.error("License activation error:", (error as Error).message);
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
    console.error("License validation error:", (error as Error).message);
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
  } catch (error) {
    console.error('License revocation error:', error);
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
  } catch (error) {
    console.error('Get user license error:', error);
    return null;
  }
}
