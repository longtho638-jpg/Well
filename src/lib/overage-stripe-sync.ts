/**
 * Overage Stripe Sync
 *
 * Handles synchronization of overage transactions to Stripe.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { StripeSyncResult } from './overage-calculator-types'

export class OverageStripeSync {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  /**
   * Sync overage to Stripe (trigger Usage Record creation)
   */
  async syncToStripe(transactionId: string): Promise<StripeSyncResult> {
    try {
      const { data: transaction, error: fetchError } = await this.supabase
        .from('overage_transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (fetchError || !transaction) {
        return { success: false, error: 'Transaction not found' }
      }

      if (!transaction.stripe_subscription_item_id) {
        return { success: false, error: 'No Stripe subscription item ID' }
      }

      const { data, error } = await this.supabase.functions.invoke('stripe-usage-record', {
        body: {
          subscription_item_id: transaction.stripe_subscription_item_id,
          usage_records: [
            {
              subscription_item: transaction.stripe_subscription_item_id,
              quantity: transaction.overage_units,
              timestamp: Math.floor(new Date(transaction.created_at).getTime() / 1000),
              action: 'increment',
            },
          ],
          feature: transaction.metric_type,
          idempotency_key: transaction.idempotency_key,
        },
      })

      if (error) {
        return { success: false, error: error.message }
      }

      await this.supabase
        .from('overage_transactions')
        .update({
          stripe_sync_status: 'synced',
          stripe_synced_at: new Date().toISOString(),
        })
        .eq('id', transactionId)

      return {
        success: true,
        stripeUsageRecordId: data?.id,
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }
}
