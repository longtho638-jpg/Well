/**
 * RaaS License Types
 */

export interface RaaSLicense {
  id: string;
  license_key: string;
  user_id: string;
  status: 'active' | 'expired' | 'revoked' | 'pending';
  features: {
    adminDashboard: boolean;
    payosWebhook: boolean;
    commissionDistribution: boolean;
    policyEngine: boolean;
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

export type LicenseStatus = RaaSLicense['status'];

export const STATUS_COLORS: Record<LicenseStatus, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  expired: 'bg-red-500/20 text-red-400 border-red-500/30',
  revoked: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};
