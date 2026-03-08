/**
 * Feature Flags Sync Component - Phase 6.6
 *
 * Toggle feature flags for tenant licenses.
 * Allows admins to enable/disable specific features per tenant.
 *
 * @example
 * ```tsx
 * <FeatureFlagsSync
 *   tenantId={tenantId}
 *   availableFeatures={['advanced_analytics', 'custom_models', 'api_access']}
 *   enabledFlags={{ advanced_analytics: true, custom_models: false }}
 *   onFlagsUpdated={() => refreshLicense()}
 * />
 * ```
 */

import React, { useState, useCallback, useMemo } from 'react';
import { RefreshCw, Save, AlertCircle } from 'lucide-react';
import { syncFeatureFlags, getFeatureFlags } from '@/lib/tenant-license-client';

interface FeatureFlagDefinition {
  key: string;
  label: string;
  description: string;
  tier?: 'basic' | 'pro' | 'enterprise' | 'unlimited';
}

interface FeatureFlagsSyncProps {
  tenantId: string;
  availableFeatures?: FeatureFlagDefinition[];
  initialFlags?: Record<string, boolean>;
  onFlagsUpdated?: (flags: Record<string, boolean>) => void;
  readOnly?: boolean;
}

const DEFAULT_FEATURES: FeatureFlagDefinition[] = [
  {
    key: 'advanced_analytics',
    label: 'Advanced Analytics',
    description: 'Access to detailed usage analytics and reports',
    tier: 'pro',
  },
  {
    key: 'custom_models',
    label: 'Custom Models',
    description: 'Deploy and use custom ML models',
    tier: 'enterprise',
  },
  {
    key: 'api_access',
    label: 'API Access',
    description: 'Full REST API access',
    tier: 'basic',
  },
  {
    key: 'webhook_events',
    label: 'Webhook Events',
    description: 'Receive real-time webhook notifications',
    tier: 'pro',
  },
  {
    key: 'priority_support',
    label: 'Priority Support',
    description: '24/7 priority customer support',
    tier: 'enterprise',
  },
  {
    key: 'multi_tenant',
    label: 'Multi-Tenant',
    description: 'Manage multiple sub-tenants',
    tier: 'enterprise',
  },
  {
    key: 'audit_logs',
    label: 'Audit Logs',
    description: 'Access to detailed audit trail',
    tier: 'pro',
  },
  {
    key: 'sso_integration',
    label: 'SSO Integration',
    description: 'Single Sign-On with SAML/OAuth',
    tier: 'enterprise',
  },
];

export const FeatureFlagsSync: React.FC<FeatureFlagsSyncProps> = ({
  tenantId,
  availableFeatures = DEFAULT_FEATURES,
  initialFlags = {},
  onFlagsUpdated,
  readOnly = false,
}) => {
  const [flags, setFlags] = useState<Record<string, boolean>>(initialFlags);
  const [pendingFlags, setPendingFlags] = useState<Record<string, boolean>>(initialFlags);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch flags on mount
  const fetchFlags = useCallback(async () => {
    if (!tenantId) return;

    try {
      setLoading(true);
      setError(null);
      const fetchedFlags = await getFeatureFlags(tenantId);
      if (fetchedFlags) {
        setFlags(fetchedFlags);
        setPendingFlags(fetchedFlags);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch flags');
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  React.useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  const handleToggle = useCallback((key: string) => {
    setPendingFlags((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!tenantId) return;

    try {
      setSaving(true);
      setError(null);

      const result = await syncFeatureFlags(pendingFlags, tenantId);

      if (result.success) {
        setFlags(pendingFlags);
        onFlagsUpdated?.(pendingFlags);
      } else {
        setError(result.error || 'Failed to save flags');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setSaving(false);
    }
  }, [tenantId, pendingFlags, onFlagsUpdated]);

  const hasChanges = useMemo(() => {
    const flagKeys = Object.keys(flags);
    const pendingKeys = Object.keys(pendingFlags);
    if (flagKeys.length !== pendingKeys.length) return true;
    return flagKeys.some((key) => flags[key] !== pendingFlags[key]);
  }, [flags, pendingFlags]);

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'basic': return 'text-zinc-400';
      case 'pro': return 'text-blue-400';
      case 'enterprise': return 'text-purple-400';
      case 'unlimited': return 'text-amber-400';
      default: return 'text-zinc-400';
    }
  };

  const getTierBadge = (tier?: string) => {
    if (!tier) return null;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${
        tier === 'basic' ? 'border-zinc-500/30 text-zinc-400' :
        tier === 'pro' ? 'border-blue-500/30 text-blue-400' :
        tier === 'enterprise' ? 'border-purple-500/30 text-purple-400' :
        'border-amber-500/30 text-amber-400'
      }`}>
        {tier.charAt(0).toUpperCase() + tier.slice(1)}
      </span>
    );
  };

  return (
    <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10">
            <svg className="w-5 h-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Feature Flags</h3>
            <p className="text-xs text-zinc-400">Manage tenant feature access</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFlags}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
            title="Refresh flags"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {hasChanges && !readOnly && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:bg-zinc-600 text-white text-xs font-medium transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              Save Changes
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-gray-900/50 animate-pulse" />
          ))}
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-2 text-xs text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Feature List */}
      {!loading && (
        <div className="space-y-3">
          {availableFeatures.map((feature) => {
            const isEnabled = pendingFlags[feature.key] ?? false;

            return (
              <div
                key={feature.key}
                className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                  isEnabled
                    ? 'bg-purple-500/10 border-purple-500/20'
                    : 'bg-gray-900/50 border-white/10'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{feature.label}</span>
                    {getTierBadge(feature.tier)}
                  </div>
                  <p className="text-xs text-zinc-400">{feature.description}</p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={() => !readOnly && handleToggle(feature.key)}
                  disabled={readOnly}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    isEnabled
                      ? 'bg-purple-500'
                      : 'bg-zinc-600'
                  } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      isEnabled ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Changes Indicator */}
      {hasChanges && !readOnly && (
        <div className="mt-4 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <p className="text-xs text-purple-400">
            You have unsaved changes. Click "Save Changes" to apply.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeatureFlagsSync;
