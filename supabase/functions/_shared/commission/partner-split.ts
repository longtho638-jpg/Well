/* eslint-disable no-console */
/**
 * Phase 2B: Partner Split - 60/40 Referrer/Sponsor Distribution
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export async function distributePartnerSplit(
  supabase: SupabaseClient,
  orderId: string,
  userId: string,
  orderTotal: number
) {
  console.log('[Phase2B] Calculating partner split...');

  const { data: user } = await supabase
    .from('users')
    .select('sponsor_id')
    .eq('id', userId)
    .single();

  if (!user?.sponsor_id) {
    console.log('[Phase2B] No sponsor found, skipping partner split');
    return;
  }

  const { data: splitConfig } = await supabase
    .from('partner_splits')
    .select('referrer_id, sponsor_id, split_percentage')
    .eq('referrer_id', userId)
    .eq('sponsor_id', user.sponsor_id)
    .single();

  const referrerPercentage = splitConfig?.split_percentage || 60.00;
  const sponsorPercentage = 100.00 - referrerPercentage;

  const totalCommission = orderTotal * 0.08;
  const referrerAmount = totalCommission * (referrerPercentage / 100);
  const sponsorAmount = totalCommission * (sponsorPercentage / 100);

  console.log(`[Phase2B] Split: Referrer ${referrerAmount} (${referrerPercentage}%), Sponsor ${sponsorAmount} (${sponsorPercentage}%)`);

  if (referrerAmount > 0) {
    await supabase.from('transactions').insert({
      user_id: userId,
      amount: referrerAmount,
      type: 'partner_referrer',
      description: `Partner referrer ${referrerPercentage}% từ đơn hàng ${orderId}`,
      status: 'completed'
    });

    await supabase.rpc('increment_pending_balance', {
      x_user_id: userId,
      x_amount: referrerAmount
    });
  }

  if (sponsorAmount > 0 && splitConfig?.sponsor_id) {
    await supabase.from('transactions').insert({
      user_id: splitConfig.sponsor_id,
      amount: sponsorAmount,
      type: 'partner_sponsor',
      description: `Partner sponsor ${sponsorPercentage}% từ đơn hàng ${orderId}`,
      status: 'completed'
    });

    await supabase.rpc('increment_pending_balance', {
      x_user_id: splitConfig.sponsor_id,
      x_amount: sponsorAmount
    });
  }

  console.log('[Phase2B] Partner split distribution complete');
}
