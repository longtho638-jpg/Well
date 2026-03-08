/**
 * License Compliance Hook - Phase 6.8
 *
 * Provides methods to trigger compliance checks and view compliance status.
 * Integrates with usage-alert-webhook for automatic enforcement.
 */

import { supabase } from '@/lib/supabase'

export interface ComplianceStatus {
  orgId: string
  complianceStatus: 'compliant' | 'warning' | 'suspended' | 'revoked'
  licenseValid: boolean
  licenseTier?: string
  lastCheckedAt?: string
  suspendedAt?: string
  suspensionReason?: string
}

export interface ComplianceCheckResult {
  success: boolean
  eventId: string
  licenseValid: boolean
  enforcementAction: 'none' | 'warning' | 'suspend' | 'revoke'
  orgStatus: 'compliant' | 'warning' | 'suspended' | 'revoked'
  error?: string
}

export interface ComplianceCheckOptions {
  userId: string
  orgId: string
  licenseId: string
  checkType?: 'usage_threshold' | 'periodic' | 'manual' | 'api_call'
  triggerReason?: string
  currentUsage?: number
  quotaLimit?: number
  usagePercentage?: number
}

/**
 * Trigger license compliance check
 */
export async function checkLicenseCompliance(
  options: ComplianceCheckOptions
): Promise<ComplianceCheckResult> {
  try {
    const { data, error } = await supabase.functions.invoke('license-compliance-enforcer', {
      body: {
        user_id: options.userId,
        org_id: options.orgId,
        license_id: options.licenseId,
        check_type: options.checkType || 'manual',
        trigger_reason: options.triggerReason,
        current_usage: options.currentUsage,
        quota_limit: options.quotaLimit,
        usage_percentage: options.usagePercentage,
      },
    })

    if (error) {
      return {
        success: false,
        eventId: '',
        licenseValid: false,
        enforcementAction: 'none',
        orgStatus: 'compliant',
        error: error.message,
      }
    }

    return {
      success: data.success,
      eventId: data.event_id,
      licenseValid: data.license_valid,
      enforcementAction: data.enforcement_action,
      orgStatus: data.org_status,
      error: data.error,
    }
  } catch (err) {
    return {
      success: false,
      eventId: '',
      licenseValid: false,
      enforcementAction: 'none',
      orgStatus: 'compliant',
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

/**
 * Get current compliance status for organization
 */
export async function getComplianceStatus(orgId: string): Promise<ComplianceStatus | null> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, compliance_status, compliance_checked_at, suspended_at, suspension_reason')
      .eq('id', orgId)
      .single()

    if (error || !data) {
      return null
    }

    // Get latest license info
    const { data: licenseData } = await supabase
      .from('raas_licenses')
      .select('tier, status')
      .eq('org_id', orgId)
      .eq('status', 'active')
      .single()

    return {
      orgId: data.id,
      complianceStatus: data.compliance_status as ComplianceStatus['complianceStatus'],
      licenseValid: licenseData?.status === 'active',
      licenseTier: licenseData?.tier,
      lastCheckedAt: data.compliance_checked_at || undefined,
      suspendedAt: data.suspended_at || undefined,
      suspensionReason: data.suspension_reason || undefined,
    }
  } catch (err) {
    console.error('[getComplianceStatus] Error:', err)
    return null
  }
}

/**
 * Get compliance history for user/org
 */
export async function getComplianceHistory(
  userId: string,
  limit = 20
): Promise<Array<{
  eventId: string
  checkType: string
  licenseStatus: string
  enforcementAction: string
  createdAt: string
  error?: string
}>> {
  try {
    const { data, error } = await supabase
      .from('license_compliance_logs')
      .select('event_id, check_type, license_status, enforcement_action, error_message, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return []
    }

    return data.map((item: any) => ({
      eventId: item.event_id,
      checkType: item.check_type,
      licenseStatus: item.license_status,
      enforcementAction: item.enforcement_action,
      createdAt: item.created_at,
      error: item.error_message,
    }))
  } catch (err) {
    console.error('[getComplianceHistory] Error:', err)
    return []
  }
}

/**
 * Reactivate organization (after license renewal)
 * Requires admin privileges
 */
export async function reactivateOrganization(
  orgId: string,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('reactivate_organization', {
      p_org_id: orgId,
      p_user_id: userId,
    })

    if (error) {
      console.error('[reactivateOrganization] Error:', error)
      return false
    }

    return true
  } catch (err) {
    console.error('[reactivateOrganization] Error:', err)
    return false
  }
}

/**
 * Auto-check compliance when usage threshold breached
 * Call this from usage-alert-webhook flow
 */
export async function autoCheckComplianceOnThreshold(
  userId: string,
  orgId: string,
  licenseId: string,
  usagePercentage: number
): Promise<ComplianceCheckResult> {
  // Only check at 90% and 100% thresholds
  if (usagePercentage < 90) {
    return {
      success: true,
      eventId: crypto.randomUUID(),
      licenseValid: true,
      enforcementAction: 'none',
      orgStatus: 'compliant',
    }
  }

  return checkLicenseCompliance({
    userId,
    orgId,
    licenseId,
    checkType: 'usage_threshold',
    triggerReason: usagePercentage >= 100 ? 'usage_100_percent' : 'usage_90_percent',
    usagePercentage,
  })
}

export const complianceClient = {
  checkLicenseCompliance,
  getComplianceStatus,
  getComplianceHistory,
  reactivateOrganization,
  autoCheckComplianceOnThreshold,
}
