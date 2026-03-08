/**
 * Tenant License Card Component - Phase 6.6
 *
 * Displays tenant license status with visual indicators.
 * Shows tier, validity period, features, and compliance status.
 *
 * @example
 * ```tsx
 * <TenantLicenseCard tenantId={tenantId} onViewDetails={() => navigate(`/tenant/${tenantId}`)} />
 * ```
 */

import React from 'react';
import { CheckCircle, AlertCircle, Clock, XCircle, Shield, Calendar, Layers } from 'lucide-react';

interface TenantLicenseCardProps {
  tenantId: string;
  tenantName?: string;
  tier: 'basic' | 'pro' | 'enterprise' | 'unlimited';
  status: 'active' | 'suspended' | 'expired' | 'revoked';
  validFrom: string;
  validUntil?: string;
  features?: string[];
  complianceScore?: number;
  onViewDetails?: () => void;
  onSuspend?: () => void;
  onReactivate?: () => void;
}

export const TenantLicenseCard: React.FC<TenantLicenseCardProps> = ({
  tenantId,
  tenantName,
  tier,
  status,
  validFrom,
  validUntil,
  features = [],
  complianceScore,
  onViewDetails,
  onSuspend,
  onReactivate,
}) => {
  const statusConfig = {
    active: {
      icon: CheckCircle,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      label: 'Hoạt động',
    },
    suspended: {
      icon: AlertCircle,
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
      label: 'Đình chỉ',
    },
    expired: {
      icon: Clock,
      color: 'text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/20',
      label: 'Hết hạn',
    },
    revoked: {
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      label: 'Thu hồi',
    },
  };

  const tierConfig = {
    basic: { label: 'Basic', color: 'text-zinc-400', border: 'border-zinc-500/20' },
    pro: { label: 'Pro', color: 'text-blue-400', border: 'border-blue-500/20' },
    enterprise: { label: 'Enterprise', color: 'text-purple-400', border: 'border-purple-500/20' },
    unlimited: { label: 'Unlimited', color: 'text-amber-400', border: 'border-amber-500/20' },
  };

  const config = statusConfig[status];
  const tierConfigItem = tierConfig[tier];
  const StatusIcon = config.icon;

  const isGracePeriod = validUntil && new Date(validUntil) < new Date() && status === 'active';
  const daysUntilExpiry = validUntil
    ? Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className={`rounded-xl border p-5 ${config.bgColor} ${config.borderColor}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${config.bgColor}`}>
            <StatusIcon className={`w-5 h-5 ${config.color}`} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-white">
              {tenantName || tenantId.slice(0, 12)}...
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${tierConfigItem.border} ${tierConfigItem.color}`}>
                {tierConfigItem.label}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Score */}
        {complianceScore !== undefined && (
          <div className="text-right">
            <div className="flex items-center gap-1">
              <Shield className="w-4 h-4 text-zinc-400" />
              <span className="text-xs text-zinc-400">Compliance</span>
            </div>
            <p className={`text-lg font-bold ${
              complianceScore >= 90 ? 'text-emerald-400' :
              complianceScore >= 70 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {complianceScore}%
            </p>
          </div>
        )}
      </div>

      {/* Validity Period */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Calendar className="w-3.5 h-3.5" />
          <span>Hiệu lực: {new Date(validFrom).toLocaleDateString('vi-VN')}</span>
        </div>
        {validUntil && (
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-zinc-400">Hết hạn: {new Date(validUntil).toLocaleDateString('vi-VN')}</span>
            {daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry > 0 && (
              <span className="text-amber-400 font-medium">({daysUntilExpiry} ngày)</span>
            )}
            {isGracePeriod && (
              <span className="text-red-400 font-medium">(Đã quá hạn)</span>
            )}
          </div>
        )}
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Features ({features.length})</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {features.slice(0, 6).map((feature) => (
              <span
                key={feature}
                className="text-xs px-2 py-1 rounded-md bg-white/5 text-zinc-300 border border-white/10"
              >
                {feature}
              </span>
            ))}
            {features.length > 6 && (
              <span className="text-xs px-2 py-1 text-zinc-500">+{features.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-3 border-t border-white/10">
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="flex-1 py-2 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            Xem chi tiết
          </button>
        )}
        {status === 'active' && onSuspend && (
          <button
            onClick={onSuspend}
            className="flex-1 py-2 text-xs font-medium rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 border border-amber-500/30 transition-colors"
          >
            Đình chỉ
          </button>
        )}
        {(status === 'suspended' || status === 'revoked') && onReactivate && (
          <button
            onClick={onReactivate}
            className="flex-1 py-2 text-xs font-medium rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 transition-colors"
          >
            Kích hoạt lại
          </button>
        )}
      </div>
    </div>
  );
};

export default TenantLicenseCard;
