/**
 * RaaS License Management Hook
 * ROIaaS Phase 2.2: Added suspend, unsuspend, updateTier, getUsage methods
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { RaaSLicense, LicenseStatus, LicenseTier, LicenseQuota } from '@/types/raas-license';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function useRaasLicenses() {
  const [licenses, setLicenses] = useState<RaaSLicense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'all'>('all');

  // Fetch licenses
  const fetchLicenses = useCallback(async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('raas_licenses')
        .select('*, users(email, full_name)')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLicenses((data || []) as RaaSLicense[]);
      setError(null);
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch audit logs for a specific license
  const fetchAuditLogs = useCallback(async (licenseId: string) => {
    try {
      const { data, error } = await supabase
        .from('raas_license_audit_logs')
        .select('*')
        .eq('license_id', licenseId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch {
      return [];
    }
  }, []);

  // Suspend a license
  const suspendLicense = useCallback(async (licenseId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('raas_licenses')
        .update({
          status: 'suspended' as LicenseStatus,
          metadata: {
            suspended_reason: reason,
            suspended_at: new Date().toISOString(),
            suspended_by: 'admin'
          },
        })
        .eq('id', licenseId);

      if (error) throw error;
      await fetchLicenses();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [fetchLicenses]);

  // Unsuspend a license
  const unsuspendLicense = useCallback(async (licenseId: string) => {
    try {
      const { error } = await supabase
        .from('raas_licenses')
        .update({
          status: 'active' as LicenseStatus,
          metadata: { unsuspended_at: new Date().toISOString() },
        })
        .eq('id', licenseId);

      if (error) throw error;
      await fetchLicenses();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [fetchLicenses]);

  // Update tier of a license
  const updateTier = useCallback(async (licenseId: string, tier: LicenseTier) => {
    try {
      const { error } = await supabase
        .from('raas_licenses')
        .update({ tier })
        .eq('id', licenseId);

      if (error) throw error;
      await fetchLicenses();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [fetchLicenses]);

  // Get usage for a license
  const getUsage = useCallback(async (licenseId: string): Promise<LicenseQuota | null> => {
    try {
      const { data, error } = await supabase
        .from('usage_records')
        .select('api_calls, tokens')
        .eq('license_id', licenseId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return { apiCalls: data?.api_calls || 0, tokens: data?.tokens || 0 };
    } catch {
      return null;
    }
  }, []);

  // Revoke a license
  const revokeLicense = useCallback(async (licenseId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('raas_licenses')
        .update({
          status: 'revoked',
          metadata: { revoked_reason: reason, revoked_at: new Date().toISOString() },
        })
        .eq('id', licenseId);

      if (error) throw error;
      await fetchLicenses();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [fetchLicenses]);

  // Activate a pending license
  const activateLicense = useCallback(async (licenseId: string) => {
    try {
      const { error } = await supabase
        .from('raas_licenses')
        .update({ status: 'active' })
        .eq('id', licenseId);

      if (error) throw error;
      await fetchLicenses();
      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [fetchLicenses]);

  // Generate a new license key
  const generateLicenseKey = useCallback((userId: string): string => {
    const timestamp = Math.floor(Date.now() / 1000);
    const hashInput = `${userId}-${timestamp}-${Math.random().toString(36).substring(2, 15) || Math.random()}`;
    let hash = 0;
    for (let i = 0; i < hashInput.length; i++) {
      const char = hashInput.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    const hashStr = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0');
    return `RAAS-${timestamp}-${hashStr}`;
  }, []);

  // Create a new license
  const createLicense = useCallback(async (
    userId: string,
    expiresAt: string,
    tier: LicenseTier = 'basic',
    features?: RaaSLicense['features']
  ) => {
    try {
      const licenseKey = generateLicenseKey(userId);
      const { data, error } = await supabase
        .from('raas_licenses')
        .insert({
          license_key: licenseKey,
          user_id: userId,
          tier,
          status: 'active',
          features: features || {
            adminDashboard: true,
            payosWebhook: tier !== 'basic',
            commissionDistribution: tier !== 'basic',
            policyEngine: tier === 'enterprise' || tier === 'master',
          },
          expires_at: expiresAt,
          metadata: { created_via: 'admin_dashboard' },
        })
        .select()
        .single();

      if (error) throw error;
      await fetchLicenses();
      return { success: true, license: data };
    } catch (err: unknown) {
      return { success: false, error: (err as Error).message };
    }
  }, [generateLicenseKey, fetchLicenses]);

  useEffect(() => {
    fetchLicenses();
  }, [fetchLicenses]);

  return {
    licenses,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    fetchLicenses,
    fetchAuditLogs,
    suspendLicense,
    unsuspendLicense,
    updateTier,
    getUsage,
    revokeLicense,
    activateLicense,
    createLicense,
    generateLicenseKey,
  };
}
