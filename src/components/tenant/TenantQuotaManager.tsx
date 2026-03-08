/**
 * Tenant Quota Manager Component - Phase 6.6
 *
 * Form for applying quota overrides to tenant licenses.
 * Allows admins to temporarily increase limits for specific metrics.
 *
 * @example
 * ```tsx
 * <TenantQuotaManager
 *   tenantId={tenantId}
 *   currentLimits={{ api_calls: 10000, tokens: 500000 }}
 *   onOverrideApplied={() => refreshLicense()}
 * />
 * ```
 */

import React, { useState, useCallback } from 'react';
import { Settings, TrendingUp, Calendar, Check, X } from 'lucide-react';
import { applyQuotaOverride } from '@/lib/tenant-license-client';

interface QuotaOverrideForm {
  metricType: string;
  newLimit: number;
  validUntil: string;
  reason: string;
}

interface TenantQuotaManagerProps {
  tenantId: string;
  currentLimits?: {
    api_calls?: number;
    tokens?: number;
    compute_minutes?: number;
    model_inferences?: number;
    agent_executions?: number;
  };
  onOverrideApplied?: () => void;
  onClose?: () => void;
}

const METRIC_OPTIONS = [
  { value: 'api_calls', label: 'API Calls', unit: 'calls' },
  { value: 'tokens', label: 'Tokens', unit: 'tokens' },
  { value: 'compute_minutes', label: 'Compute Minutes', unit: 'min' },
  { value: 'model_inferences', label: 'Model Inferences', unit: 'inferences' },
  { value: 'agent_executions', label: 'Agent Executions', unit: 'executions' },
];

export const TenantQuotaManager: React.FC<TenantQuotaManagerProps> = ({
  tenantId,
  currentLimits = {},
  onOverrideApplied,
  onClose,
}) => {
  const [formData, setFormData] = useState<QuotaOverrideForm>({
    metricType: 'api_calls',
    newLimit: 0,
    validUntil: '',
    reason: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await applyQuotaOverride({
        tenantId,
        metricType: formData.metricType,
        newLimit: formData.newLimit,
        validUntil: formData.validUntil ? new Date(formData.validUntil).toISOString() : undefined,
        reason: formData.reason || undefined,
      });

      if (result.success) {
        setSuccess(true);
        onOverrideApplied?.();
        setTimeout(() => {
          setSuccess(false);
          onClose?.();
        }, 2000);
      } else {
        setError(result.error || 'Failed to apply override');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [tenantId, formData, onOverrideApplied, onClose]);

  const selectedMetric = METRIC_OPTIONS.find(m => m.value === formData.metricType);
  const currentLimit = currentLimits[formData.metricType as keyof typeof currentLimits] || 0;
  const increasePercentage = currentLimit > 0
    ? Math.round(((formData.newLimit - currentLimit) / currentLimit) * 100)
    : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-gray-800/50 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10">
            <Settings className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">Quota Override</h3>
            <p className="text-xs text-zinc-400">Điều chỉnh giới hạn cho tenant</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Metric Type */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Metric Type
          </label>
          <select
            value={formData.metricType}
            onChange={(e) => setFormData({ ...formData, metricType: e.target.value, newLimit: currentLimits[e.target.value as keyof typeof currentLimits] || 0 })}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          >
            {METRIC_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Current Limit Display */}
        <div className="p-3 rounded-lg bg-gray-900/50 border border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-400">Giới hạn hiện tại</span>
            <span className="text-white font-medium">
              {currentLimit.toLocaleString()} {selectedMetric?.unit}
            </span>
          </div>
        </div>

        {/* New Limit */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Giới hạn mới
          </label>
          <div className="relative">
            <input
              type="number"
              value={formData.newLimit}
              onChange={(e) => setFormData({ ...formData, newLimit: parseInt(e.target.value) || 0 })}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="Enter new limit"
              min="0"
            />
            {increasePercentage > 0 && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{increasePercentage}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Valid Until */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Valid Until (optional)
            </div>
          </label>
          <input
            type="date"
            value={formData.validUntil}
            onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <p className="text-xs text-zinc-500 mt-1">Để trống nếu không có thời hạn</p>
        </div>

        {/* Reason */}
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5">
            Reason (optional)
          </label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-gray-900 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
            rows={2}
            placeholder="Lý do điều chỉnh quota..."
          />
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <Check className="w-4 h-4" />
              <span>Override applied successfully!</span>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-400 disabled:bg-zinc-600 text-white font-medium text-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? 'Applying...' : 'Apply Override'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default TenantQuotaManager;
