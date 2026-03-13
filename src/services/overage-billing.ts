/**
 * Overage Billing Service - Phase 3
 *
 * PayOS integration for overage billing. Calculates usage exceeding quotas
 * and generates PayOS payment links for collection.
 *
 * Usage:
 *   const charges = await calculateOverageCharges(orgId, '2026-03');
 *   const { checkoutUrl } = await createPayOSChargeLink(orgId, charges);
 *   await processOveragePayment(orderCode);
 */

import { supabase } from '@/lib/supabase';
import { createPayment, getPaymentStatus } from '@/services/payment/payos-client';
import { createLogger } from '@/utils/logger';
import type { VibePaymentRequest } from '@/lib/vibe-payment';

const logger = createLogger('OverageBilling');

/**
 * Overage charge record
 */
export interface OverageCharge {
  orgId: string;
  billingPeriod: string; // 'YYYY-MM'
  apiOverage: number; // USD
  bookingsOverage: number;
  reportsOverage: number;
  emailOverage: number;
  grandTotal: number;
}

/**
 * Usage metric breakdown
 */
interface UsageBreakdown {
  apiCalls: number;
  bookings: number;
  reports: number;
  emailSends: number;
}

/**
 * Quota configuration
 */
interface QuotaConfig {
  apiCallsLimit: number;
  bookingsLimit: number;
  reportsLimit: number;
  emailSendsLimit: number;
}

/**
 * Overage rates (USD)
 */
const OVERAGE_RATES = {
  apiCalls: 0.01 / 100, // $0.01 per 100 calls
  bookings: 0.10, // $0.10 per booking
  reports: 0.05, // $0.05 per report
  emailSends: 0.001, // $0.001 per email
} as const;

/**
 * Calculate overage charges for an organization
 */
export async function calculateOverageCharges(
  orgId: string,
  period: string
): Promise<OverageCharge> {
  try {
    // Get usage breakdown
    const usage = await getUsageBreakdown(orgId, period);

    // Get quota limits
    const quotas = await getQuotaConfig(orgId);

    // Calculate overage for each metric
    const apiOverage = calculateApiOverage(usage.apiCalls, quotas.apiCallsLimit);
    const bookingsOverage = calculateBookingsOverage(usage.bookings, quotas.bookingsLimit);
    const reportsOverage = calculateReportsOverage(usage.reports, quotas.reportsLimit);
    const emailOverage = calculateEmailOverage(usage.emailSends, quotas.emailSendsLimit);

    const grandTotal = apiOverage + bookingsOverage + reportsOverage + emailOverage;

    return {
      orgId,
      billingPeriod: period,
      apiOverage: roundCurrency(apiOverage),
      bookingsOverage: roundCurrency(bookingsOverage),
      reportsOverage: roundCurrency(reportsOverage),
      emailOverage: roundCurrency(emailOverage),
      grandTotal: roundCurrency(grandTotal),
    };
  } catch (error) {
    logger.error('calculateOverageCharges failed', { orgId, period, error });
    throw error;
  }
}

/**
 * Create PayOS charge link for overage payment
 */
export async function createPayOSChargeLink(
  orgId: string,
  charges: OverageCharge
): Promise<{ checkoutUrl: string; orderCode: number }> {
  try {
    const orderCode = generateOrderCode(orgId, charges.billingPeriod);
    const description = `Overage charges for ${charges.billingPeriod}`;

    const paymentRequest: VibePaymentRequest = {
      orderCode,
      amount: Math.round(charges.grandTotal * 100), // Convert to cents
      description,
      items: buildPayOSItems(charges),
      cancelUrl: `${getBaseUrl()}/dashboard/billing?canceled=true`,
      returnUrl: `${getBaseUrl()}/dashboard/billing?success=true`,
    };

    const result = await createPayment(paymentRequest);

    // Record the overage charge in database
    await recordOverageCharge(orgId, charges, orderCode);

    return {
      checkoutUrl: result.checkoutUrl,
      orderCode: result.orderCode,
    };
  } catch (error) {
    logger.error('createPayOSChargeLink failed', { orgId, charges, error });
    throw error;
  }
}

/**
 * Process overage payment completion
 */
export async function processOveragePayment(orderCode: number): Promise<void> {
  try {
    const status = await getPaymentStatus(orderCode);

    if (status.status === 'PAID') {
      // Mark overage charges as paid
      await markChargesAsPaid(orderCode);

      // Update usage billing sync log
      await updateUsageBillingSyncLog(orderCode);

      logger.info('Overage payment processed', { orderCode });
    }
  } catch (error) {
    logger.error('processOveragePayment failed', { orderCode, error });
    throw error;
  }
}

/**
 * Get 80% threshold warnings for usage metrics
 */
export async function get80PercentThreshold(
  orgId: string
): Promise<Array<{ metricType: string; currentUsage: number; limit: number }>> {
  try {
    const period = getCurrentPeriod();
    const usage = await getUsageBreakdown(orgId, period);
    const quotas = await getQuotaConfig(orgId);

    const thresholds: Array<{ metricType: string; currentUsage: number; limit: number }> = [];

    // Check each metric for 80% threshold
    const metrics = [
      { type: 'api_calls', usage: usage.apiCalls, limit: quotas.apiCallsLimit },
      { type: 'bookings', usage: usage.bookings, limit: quotas.bookingsLimit },
      { type: 'reports', usage: usage.reports, limit: quotas.reportsLimit },
      { type: 'email_sends', usage: usage.emailSends, limit: quotas.emailSendsLimit },
    ];

    for (const metric of metrics) {
      const threshold = metric.limit * 0.8;
      if (metric.usage >= threshold) {
        thresholds.push({
          metricType: metric.type,
          currentUsage: metric.usage,
          limit: metric.limit,
        });
      }
    }

    return thresholds;
  } catch (error) {
    logger.error('get80PercentThreshold failed', { orgId, error });
    return [];
  }
}

// ─── Helper Functions ──────────────────────────────────────────────

/**
 * Get usage breakdown from database
 */
async function getUsageBreakdown(orgId: string, period: string): Promise<UsageBreakdown> {
  const { data, error } = await supabase
    .from('usage_metrics')
    .select('metric_type, quantity')
    .eq('org_id', orgId)
    .eq('billing_period', period);

  if (error) {
    logger.warn('Failed to fetch usage metrics', { orgId, error });
    return { apiCalls: 0, bookings: 0, reports: 0, emailSends: 0 };
  }

  const usage: UsageBreakdown = {
    apiCalls: 0,
    bookings: 0,
    reports: 0,
    emailSends: 0,
  };

  for (const row of data || []) {
    switch (row.metric_type) {
      case 'api_calls':
        usage.apiCalls += row.quantity || 0;
        break;
      case 'bookings':
        usage.bookings += row.quantity || 0;
        break;
      case 'reports':
        usage.reports += row.quantity || 0;
        break;
      case 'email_sends':
        usage.emailSends += row.quantity || 0;
        break;
    }
  }

  return usage;
}

/**
 * Get quota configuration for organization
 */
async function getQuotaConfig(orgId: string): Promise<QuotaConfig> {
  // Try to get org-specific config first
  const { data: orgConfig } = await supabase
    .from('usage_billing_config')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (orgConfig) {
    return {
      apiCallsLimit: orgConfig.api_calls_limit || 1000,
      bookingsLimit: orgConfig.bookings_limit || 10,
      reportsLimit: orgConfig.reports_limit || 5,
      emailSendsLimit: orgConfig.email_sends_limit || 100,
    };
  }

  // Fallback to plan tier config
  const { data: planConfig } = await supabase
    .from('usage_billing_config')
    .select('*')
    .eq('plan_tier', 'free')
    .single();

  return {
    apiCallsLimit: planConfig?.api_calls_limit || 1000,
    bookingsLimit: planConfig?.bookings_limit || 10,
    reportsLimit: planConfig?.reports_limit || 5,
    emailSendsLimit: planConfig?.email_sends_limit || 100,
  };
}

/**
 * Calculate API overage cost
 */
function calculateApiOverage(usage: number, limit: number): number {
  const overage = Math.max(0, usage - limit);
  return overage * OVERAGE_RATES.apiCalls;
}

/**
 * Calculate bookings overage cost
 */
function calculateBookingsOverage(usage: number, limit: number): number {
  const overage = Math.max(0, usage - limit);
  return overage * OVERAGE_RATES.bookings;
}

/**
 * Calculate reports overage cost
 */
function calculateReportsOverage(usage: number, limit: number): number {
  const overage = Math.max(0, usage - limit);
  return overage * OVERAGE_RATES.reports;
}

/**
 * Calculate email overage cost
 */
function calculateEmailOverage(usage: number, limit: number): number {
  const overage = Math.max(0, usage - limit);
  return overage * OVERAGE_RATES.emailSends;
}

/**
 * Round to 2 decimal places
 */
function roundCurrency(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Generate PayOS order code
 */
function generateOrderCode(orgId: string, period: string): number {
  const hash = `${orgId}-${period}`.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return Math.abs(hash % 1000000);
}

/**
 * Build PayOS line items
 */
function buildPayOSItems(charges: OverageCharge): VibePaymentRequest['items'] {
  const items: Array<{ name: string; quantity: number; price: number }> = [];

  if (charges.apiOverage > 0) {
    items.push({ name: 'API Calls Overage', quantity: 1, price: charges.apiOverage });
  }
  if (charges.bookingsOverage > 0) {
    items.push({ name: 'Bookings Overage', quantity: 1, price: charges.bookingsOverage });
  }
  if (charges.reportsOverage > 0) {
    items.push({ name: 'Reports Overage', quantity: 1, price: charges.reportsOverage });
  }
  if (charges.emailOverage > 0) {
    items.push({ name: 'Email Overage', quantity: 1, price: charges.emailOverage });
  }

  return items;
}

/**
 * Get organization email for billing
 */
async function getOrgEmail(orgId: string): Promise<string | undefined> {
  try {
    const { data } = await supabase
      .from('organizations')
      .select('email')
      .eq('id', orgId)
      .single();
    return data?.email || undefined;
  } catch {
    return undefined;
  }
}

/**
 * Get current period in YYYY-MM format
 */
function getCurrentPeriod(): string {
  return new Date().toISOString().slice(0, 7);
}

/**
 * Get base URL for callbacks
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
}

/**
 * Record overage charge in database
 */
async function recordOverageCharge(
  orgId: string,
  charges: OverageCharge,
  orderCode: number
): Promise<void> {
  try {
    await supabase.from('overage_charges').insert({
      org_id: orgId,
      billing_period: charges.billingPeriod,
      api_overage: charges.apiOverage,
      bookings_overage: charges.bookingsOverage,
      reports_overage: charges.reportsOverage,
      email_overage: charges.emailOverage,
      grand_total: charges.grandTotal,
      order_code: orderCode,
      status: 'pending',
    });
  } catch (error) {
    logger.warn('Failed to record overage charge', { orgId, error });
  }
}

/**
 * Mark charges as paid
 */
async function markChargesAsPaid(orderCode: number): Promise<void> {
  try {
    await supabase
      .from('overage_charges')
      .update({ status: 'paid', paid_at: new Date().toISOString() })
      .eq('order_code', orderCode);
  } catch (error) {
    logger.warn('Failed to mark charges as paid', { orderCode, error });
  }
}

/**
 * Update usage billing sync log
 */
async function updateUsageBillingSyncLog(orderCode: number): Promise<void> {
  try {
    await supabase.from('usage_billing_sync_log').insert({
      order_code: orderCode,
      status: 'success',
      synced_at: new Date().toISOString(),
    });
  } catch (error) {
    logger.warn('Failed to update sync log', { orderCode, error });
  }
}

/**
 * Overage Billing Service API
 */
export const overageBilling = {
  calculateOverageCharges,
  createPayOSChargeLink,
  processOveragePayment,
  get80PercentThreshold,
};

export default overageBilling;
