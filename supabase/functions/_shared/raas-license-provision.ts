/* eslint-disable max-lines */
/**
 * RaaS License Auto-Provisioning Service (Deno Edge Function Version)
 *
 * Tự động tạo và cấp phát license keys khi payment completed.
 * Tích hợp với PayOS webhook pipeline.
 */

import { type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

export type Tier = 'basic' | 'premium' | 'enterprise' | 'master'

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

const PLAN_TO_TIER_MAP: Record<string, Tier> = {
  'plan_basic_monthly': 'basic',
  'plan_premium_monthly': 'premium',
  'plan_enterprise_monthly': 'enterprise',
  'plan_master_monthly': 'master',
  'plan_basic_yearly': 'basic',
  'plan_premium_yearly': 'premium',
  'plan_enterprise_yearly': 'enterprise',
  'plan_master_yearly': 'master',
}

function calculateExpiration(billingCycle: 'monthly' | 'yearly'): number {
  const now = Math.floor(Date.now() / 1000)
  const secondsInMonth = 30 * 24 * 60 * 60
  const secondsInYear = 365 * 24 * 60 * 60
  return billingCycle === 'monthly' ? now + secondsInMonth : now + secondsInYear
}

function getTierFromPlan(planId: string): Tier {
  const tier = PLAN_TO_TIER_MAP[planId.toLowerCase()]
  if (!tier) throw new Error(`Unknown plan ID: ${planId}`)
  return tier
}

async function generateLicenseKey(tier: Tier, expiresAt: Date, secret: string): Promise<string> {
  const tierLower = tier.toLowerCase() as Lowercase<Tier>
  const timestamp = Math.floor(expiresAt.getTime() / 1000)
  const nonce = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  const data = `${tierLower}:${timestamp}:${nonce}`
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const dataBuffer = encoder.encode(data)

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataBuffer)
  const hmac = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  return `raas_${tierLower}_${timestamp}_${nonce}_${hmac}`
}

async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(message)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ─── Main Provisioning Function ─────────────────────────────────

export async function provisionLicenseOnPayment(
  input: LicenseProvisionInput,
  supabase: SupabaseClient,
): Promise<LicenseProvisionResult> {
  const nowIso = new Date().toISOString()

  try {
    const tier = getTierFromPlan(input.planId)
    const expiresAt = calculateExpiration(input.billingCycle)

    const secret = Deno.env.get('RAAS_LICENSE_SECRET')
    if (!secret || secret.length < 16) {
      throw new Error('RAAS_LICENSE_SECRET not configured or too short')
    }

    const fullKey = await generateLicenseKey(tier, new Date(expiresAt * 1000), secret)
    const parts = fullKey.split('_')
    const nonce = parts[3]
    const keyHash = await sha256(fullKey)

    // Lưu license vào Supabase
    const { data: license, error: insertError } = await supabase
      .from('raas_licenses')
      .insert({
        tier,
        nonce,
        key_hash: keyHash,
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
        },
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Log audit
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
        ip_address: '0.0.0.0',
        user_agent: 'PayOS-Webhook-AutoProvision',
      })
      .select('id')
      .single()

    // Gửi email (fire-and-forget)
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
      console.error('[LicenseProvision] Email send failed:', emailErr)
    }

    return {
      success: true,
      license: {
        id: (license as any).id,
        nonce,
        tier,
        expiresAt,
        key: fullKey,
        metadata: (license as any).metadata,
      },
      auditLogId: auditLog?.id,
    }

  } catch (error) {
    console.error('[LicenseProvision] Failed:', error)

    try {
      await supabase.from('raas_license_audit_logs').insert({
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

// ─── Revoke on Cancel ───────────────────────────────────────────

export async function revokeLicenseOnCancel(
  userId: string,
  supabase: SupabaseClient,
): Promise<{ success: boolean; revokedCount: number }> {
  try {
    const { data: licenses } = await supabase
      .from('raas_licenses')
      .select('nonce, id, metadata')
      .eq('(metadata->>user_id)', userId)
      .eq('is_revoked', false)
      .gt('expires_at', new Date().toISOString())

    if (!licenses || licenses.length === 0) {
      return { success: true, revokedCount: 0 }
    }

    const nowIso = new Date().toISOString()
    let revokedCount = 0

    for (const license of licenses) {
      const { error } = await supabase
        .from('raas_licenses')
        .update({
          is_revoked: true,
          revoked_at: nowIso,
          metadata: {
            ...(license.metadata as Record<string, unknown>),
            revoked_reason: 'subscription_cancelled',
            revoked_at: nowIso,
          },
        })
        .eq('id', license.id)

      if (!error) {
        revokedCount++
        await supabase.from('raas_license_audit_logs').insert({
          license_nonce: license.nonce,
          action: 'AUTO_REVOKE',
          payload: { user_id: userId, reason: 'subscription_cancelled' },
          ip_address: '0.0.0.0',
          user_agent: 'Subscription-Cancel-Revoke',
        })
      }
    }

    return { success: true, revokedCount }
  } catch (error) {
    console.error('[LicenseRevoke] Failed:', error)
    return { success: false, revokedCount: 0 }
  }
}
