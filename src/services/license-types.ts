/**
 * License Types - RaaS License Interfaces
 *
 * Shared types for license service.
 */

export interface LicenseRecord {
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

export interface LicenseActivationRequest {
  licenseKey: string;
  userId: string;
  paymentReference?: string;
}

export interface LicenseValidationResponse {
  isValid: boolean;
  license?: LicenseRecord;
  features: {
    adminDashboard: boolean;
    payosWebhook: boolean;
    commissionDistribution: boolean;
    policyEngine: boolean;
  };
  error?: string;
  daysRemaining?: number;
}
