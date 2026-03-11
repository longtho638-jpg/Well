 
/**
 * RaaS License Auto-Provisioning Service
 *
 * Tự động tạo và cấp phát license keys khi payment completed.
 * Tích hợp với PayOS webhook pipeline.
 *
 * Flow:
 * 1. Webhook nhận payment.paid event
 * 2. Xác định subscription tier từ plan_id
 * 3. Tạo license key với HMAC signature
 * 4. Lưu license vào Supabase + Redis cache
 * 5. Gửi email cho user với license key
 * 6. Log audit trail
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createHmac, randomBytes } from 'crypto'
import { createLogger } from '@/utils/logger'

const logger = createLogger('LicenseProvision')

// ─── Types ──────────────────────────────────────────────────────

export type Tier = 'basic' | 'premium' | 'enterprise' | 'master'

// ─── License Key Generator (inline for edge compatibility) ─────

function generateLicenseKey(
  tier: Tier,
  expiresAt: Date,
  secret: string
): string {
  const tierLower = tier.toLowerCase() as Lowercase<Tier>
  const timestamp = Math.floor(expiresAt.getTime() / 1000)
  const nonce = randomBytes(16).toString('hex')
  const data = `${tierLower}:${timestamp}:${nonce}`
  const hmac = createHmac('sha256', secret).update(data).digest('hex')
  return `raas_${tierLower}_${timestamp}_${nonce}_${hmac}`
}

export interface LicenseProvisionInput {
  userId: string
  planId: string
  billingCycle: 'monthly' | 'yearly'
  paymentAmount: number
  paymentId: string
  orgId?: string
}

export interface ProvisionedLicense {
  id: string
  nonce: string
  tier: Tier
  expiresAt: number
  key: string
  metadata: Record<string, unknown>
}

export interface LicenseProvisionResult {
  success: boolean
  license?: ProvisionedLicense
  error?: string
  auditLogId?: string
}

// ─── Tier Mapping ───────────────────────────────────────────────

/** Map plan IDs subscription → RaaS tiers */
const PLAN_TO_TIER_MAP: Record<string, Tier> = {
  // Monthly plans
  'plan_basic_monthly': 'basic',
  'plan_premium_monthly': 'premium',
  'plan_enterprise_monthly': 'enterprise',
  'plan_master_monthly': 'master',

  // Yearly plans
  'plan_basic_yearly': 'basic',
  'plan_premium_yearly': 'premium',
  'plan_enterprise_yearly': 'enterprise',
  'plan_master_yearly': 'master',
}

/** Calculate expiration timestamp based on billing cycle */
function calculateExpiration(billingCycle: 'monthly' | 'yearly'): number {
  const now = Math.floor(Date.now() / 1000)
  const secondsInMonth = 30 * 24 * 60 * 60
  const secondsInYear = 365 * 24 * 60 * 60

  return billingCycle === 'monthly'
    ? now + secondsInMonth
    : now + secondsInYear
}

/** Get tier from plan ID */
function getTierFromPlan(planId: string): Tier {
  const tier = PLAN_TO_TIER_MAP[planId.toLowerCase()]
  if (!tier) {
    throw new Error(`Unknown plan ID: ${planId}`)
  }
  return tier
}

// ─── Main Provisioning Function ─────────────────────────────────

/**
 * Auto-provision license khi payment completed
 */
export async function provisionLicenseOnPayment(
  input: LicenseProvisionInput,
  supabase: SupabaseClient,
): Promise<LicenseProvisionResult> {
  const now = Math.floor(Date.now() / 1000)
  const nowIso = new Date().toISOString()

  try {
    // Step 1: Xác định tier từ plan
    const tier = getTierFromPlan(input.planId)

    // Step 2: Tính expiration timestamp
    const expiresAt = calculateExpiration(input.billingCycle)

    // Step 3: Get secret từ env
    const secret = process.env.RAAS_LICENSE_SECRET
    if (!secret || secret.length < 16) {
      throw new Error('RAAS_LICENSE_SECRET not configured or too short')
    }

    // Step 4: Generate license key
    const fullKey = generateLicenseKey(
      tier,
      new Date(expiresAt * 1000),
      secret
    )

    // Parse nonce từ key
    const parts = fullKey.split('_')
    const nonce = parts[3]

    // Step 5: Lưu license vào Supabase
    const { data: license, error: insertError } = await supabase
      .from('raas_licenses')
      .insert({
        tier,
        nonce,
        key_hash: await sha256(fullKey),
        expires_at: new Date(expiresAt * 1000).toISOString(),
        created_by: 'system:auto-provision',
        metadata: {
          user_id: input.userId,
          plan_id: input.planId,
          billing_cycle: input.billingCycle,
          payment_id: input.paymentId,
          payment_amount: input.paymentAmount,
          provisioned_at: nowIso,
          org_id: input.orgId,
        } as Record<string, unknown>,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Step 6: Lưu audit log
    const { data: auditLog } = await supabase
      .from('raas_license_audit_logs')
      .insert({
        license_nonce: nonce,
        action: 'AUTO_PROVISION',
        payload: {
          user_id: input.userId,
          plan_id: input.planId,
          billing_cycle: input.billingCycle,
          payment_id: input.paymentId,
          tier,
        },
        ip_address: '0.0.0.0', // webhook IP
        user_agent: 'PayOS-Webhook-AutoProvision',
      })
      .select('id')
      .single()

    // Step 7: Gửi email cho user (fire-and-forget)
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('email, full_name')
        .eq('id', input.userId)
        .single()

      if (userData?.email) {
        await supabase.functions.invoke('send-email', {
          body: {
            to: userData.email,
            subject: `🎉 License Key ${tier.toUpperCase()} - WellNexus`,
            templateType: 'license-delivery',
            data: {
              userName: userData.full_name || 'Bạn',
              tier: tier.toUpperCase(),
              licenseKey: fullKey,
              expiresAt: new Date(expiresAt * 1000).toLocaleDateString('vi-VN'),
              billingCycle: input.billingCycle === 'monthly' ? 'Hàng tháng' : 'Hàng năm',
            },
          },
        })
      }
    } catch (emailErr) {
      // Email failure shouldn't block provisioning
      logger.error('Email send failed', { error: emailErr })
    }

    return {
      success: true,
      license: {
        id: license.id,
        nonce,
        tier,
        expiresAt,
        key: fullKey,
        metadata: license.metadata,
      },
      auditLogId: auditLog?.id,
    }

  } catch (error) {
    logger.error('License provision failed', { error })

    // Log error to audit
    try {
      await supabase
        .from('raas_license_audit_logs')
        .insert({
          license_nonce: 'unknown',
          action: 'AUTO_PROVISION_FAILED',
          payload: {
            user_id: input.userId,
            plan_id: input.planId,
            error: error instanceof Error ? error.message : String(error),
          },
          ip_address: '0.0.0.0',
          user_agent: 'PayOS-Webhook-AutoProvision',
        })
    } catch (err) { void(err) }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// ─── Helper Functions ───────────────────────────────────────────

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message)
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Revoke license khi subscription cancelled/refunded
 */
export async function revokeLicenseOnCancel(
  userId: string,
  supabase: SupabaseClient,
): Promise<{ success: boolean; revokedCount: number }> {
  try {
    // Find all active licenses for user
    const { data: licenses } = await supabase
      .from('raas_licenses')
      .select('nonce, id')
      .eq('(metadata->>user_id)', userId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())

    if (!licenses || licenses.length === 0) {
      return { success: true, revokedCount: 0 }
    }

    const now = Math.floor(Date.now() / 1000)
    const nowIso = new Date().toISOString()

    // Revoke each license
    let revokedCount = 0
    for (const license of licenses) {
      const { error } = await supabase
        .from('raas_licenses')
        .update({
          is_revoked: true,
          revoked_at: nowIso,
          metadata: {
            revoked_reason: 'subscription_cancelled',
            revoked_at: nowIso,
          },
        })
        .eq('id', license.id)

      if (!error) {
        revokedCount++

        // Log audit
        await supabase
          .from('raas_license_audit_logs')
          .insert({
            license_nonce: license.nonce,
            action: 'AUTO_REVOKE',
            payload: {
              user_id: userId,
              reason: 'subscription_cancelled',
            },
            ip_address: '0.0.0.0',
            user_agent: 'Subscription-Cancel-Revoke',
          })
      }
    }

    return { success: true, revokedCount }
  } catch (error) {
    logger.error('License revoke failed', { error })
    return { success: false, revokedCount: 0 }
  }
}
