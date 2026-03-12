/**
 * Stripe Billing Client - Frontend Helper
 *
 * Provides methods to report usage, check billing status, and manage subscriptions.
 * Communicates with Supabase Edge Functions for Stripe API calls.
 */

import { supabase } from '@/lib/supabase';

export interface UsageReportParams {
  subscriptionItemId: string;
  feature: 'api_call' | 'tokens' | 'model_inference' | 'agent_execution' | 'compute_ms';
  quantity: number;
  timestamp?: number;
  action?: 'set' | 'increment' | 'clear';
}

export interface UsageReportResult {
  success: boolean;
  records_created: number;
  records_failed: number;
  audit_log_ids: string[];
  failed_records?: Array<{
    record: UsageReportParams;
    error: string;
    audit_log_id?: string;
  }>;
}

export interface BillingStatus {
  subscriptionId: string;
  status: 'active' | 'past_due' | 'incomplete' | 'trialing' | 'canceled' | 'unpaid';
  currentPeriodEnd: string;
  usageThisPeriod: number;
  invoiceDue: number | null;
  isOverage: boolean;
  customerPortalUrl?: string;
}

export interface CustomerPortalSession {
  url: string;
  expiresAt: number;
}

/**
 * Report usage to Stripe via Edge Function
 */
export async function reportUsage(params: UsageReportParams): Promise<UsageReportResult> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-usage-record', {
      body: {
        subscription_item_id: params.subscriptionItemId,
        usage_records: [{
          subscription_item: params.subscriptionItemId,
          quantity: params.quantity,
          timestamp: params.timestamp || Math.floor(Date.now() / 1000),
          action: params.action || 'increment',
        }],
        feature: params.feature,
      },
    });

    if (error) {
      return {
        success: false,
        records_created: 0,
        records_failed: 1,
        audit_log_ids: [],
        failed_records: [{ record: params, error: error.message }],
      };
    }

    return data as UsageReportResult;
  } catch (err) {
    return {
      success: false,
      records_created: 0,
      records_failed: 1,
      audit_log_ids: [],
      failed_records: [{
        record: params,
        error: err instanceof Error ? err.message : 'Unknown error'
      }],
    };
  }
}

/**
 * Get current billing status for user
 */
export async function getBillingStatus(userId: string): Promise<BillingStatus | null> {
  try {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        stripe_subscription_id,
        status,
        current_period_end,
        metadata
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .or('status.eq:past_due,status.eq:trialing')
      .single();

    if (error || !data) {
      return null;
    }

    const subscription = data as any;

    // Get usage this period
    const periodStart = new Date();
    periodStart.setDate(1); // Start of current billing period

    const { data: usageData } = await supabase
      .from('usage_aggregations')
      .select('total_quantity')
      .eq('subscription_item_id', subscription.stripe_subscription_id)
      .gte('period_start', periodStart.toISOString());

    const usageThisPeriod = usageData?.reduce((sum, r) => sum + (r.total_quantity || 0), 0) || 0;

    // Check if overage (usage > plan allowance)
    const planLimits: Record<string, number> = {
      'free': 1000,
      'basic': 10000,
      'pro': 50000,
      'enterprise': 200000,
    };

    const currentPlan = subscription.metadata?.plan_slug || 'free';
    const planLimit = planLimits[currentPlan] || planLimits['free'];
    const isOverage = usageThisPeriod > planLimit;

    return {
      subscriptionId: subscription.stripe_subscription_id,
      status: subscription.status,
      currentPeriodEnd: subscription.current_period_end,
      usageThisPeriod: usageThisPeriod,
      invoiceDue: subscription.status === 'past_due' ? 9900 : null, // $99 example
      isOverage,
    };
  } catch (err) {
    // Error handled by returning null
    return null;
  }
}

/**
 * Get usage summary for current period
 */
export async function getUsageSummary(
  subscriptionItemId: string,
  periodStart: string,
  periodEnd: string
) {
  try {
    const { data, error } = await supabase.functions.invoke('usage-summary', {
      body: {
        subscription_item_id: subscriptionItemId,
        period_start: periodStart,
        period_end: periodEnd,
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  } catch (err) {
    // Error handled by returning null
    return null;
  }
}

/**
 * Create Stripe Customer Portal session
 */
export async function createCustomerPortalSession(
  customerId: string,
  returnUrl?: string
): Promise<CustomerPortalSession | null> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
      body: {
        customer_id: customerId,
        return_url: returnUrl || typeof window !== 'undefined' ? window.location.href : undefined,
      },
    });

    if (error) {
      // Error handled by returning null
      return null;
    }

    return data as CustomerPortalSession;
  } catch (err) {
    // Error handled by returning null
    return null;
  }
}

/**
 * Get or create Customer Portal URL
 * Caches the URL for quick access (Stripe URLs expire but sessions can be reused)
 */
export async function getCustomerPortalUrl(
  customerId: string
): Promise<string | null> {
  try {
    // Try to get cached portal URL from localStorage
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(`stripe_portal_url_${customerId}`);
      const cachedData = cached ? JSON.parse(cached) : null;

      // Use cached URL if still valid (check 1 hour before expiry)
      if (cachedData && cachedData.expiresAt > Date.now() + 3600000) {
        return cachedData.url;
      }
    }

    // Create new session
    const session = await createCustomerPortalSession(customerId);
    if (!session?.url) {
      return null;
    }

    // Cache the URL
    if (typeof window !== 'undefined') {
      localStorage.setItem(`stripe_portal_url_${customerId}`, JSON.stringify({
        url: session.url,
        expiresAt: session.expiresAt,
        cachedAt: Date.now(),
      }));
    }

    return session.url;
  } catch (err) {
    // Error handled by returning null
    return null;
  }
}

export const stripeBillingClient = {
  reportUsage,
  getBillingStatus,
  getUsageSummary,
  createCustomerPortalSession,
  getCustomerPortalUrl,
};
