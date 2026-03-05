/* eslint-disable no-console */
/**
 * Phase 2C: Performance Bonus Pool - Monthly Top 10 Distribution
 * 2% of monthly volume distributed to top 10 performers
 * Distribution: 1st: 25%, 2nd: 20%, 3rd: 15%, 4th: 12%, 5th: 10%, 6th: 8%, 7th: 5%, 8th: 3%, 9th: 1.5%, 10th: 0.5%
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BONUS_PERCENTAGES = [25, 20, 15, 12, 10, 8, 5, 3, 1.5, 0.5]; // Top 10 shares

export async function calculateMonthlyBonusPool(
  supabase: SupabaseClient,
  month: number,
  year: number
) {
  console.log(`[Phase2C] Calculating bonus pool for ${month}/${year}...`);

  const { data: orders } = await supabase
    .from('orders')
    .select('total_vnd')
    .eq('status', 'completed')
    .gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`)
    .lt('created_at', `${year}-${(month + 1).toString().padStart(2, '0')}-01`);

  const totalVolume = orders?.reduce((sum: number, o: { total_vnd: string | number }) =>
    sum + Number(o.total_vnd), 0) || 0;

  const totalPool = totalVolume * 0.02;

  console.log(`[Phase2C] Total volume: ${totalVolume}, Bonus pool: ${totalPool}`);

  const { data: existingPool } = await supabase
    .from('bonus_pools')
    .select('id')
    .eq('month', month)
    .eq('year', year)
    .single();

  let bonusPoolId: string;

  if (existingPool) {
    await supabase.from('bonus_pools').update({
      total_pool_amount: totalPool,
      total_volume: totalVolume,
      status: 'calculating'
    }).eq('id', existingPool.id);
    bonusPoolId = existingPool.id;
  } else {
    const { data: newPool } = await supabase.from('bonus_pools').insert({
      month,
      year,
      total_pool_amount: totalPool,
      total_volume: totalVolume,
      status: 'calculating'
    }).select('id').single();
    bonusPoolId = newPool.id;
  }

  const { data: topPerformers } = await supabase
    .from('users')
    .select('id, team_volume')
    .order('team_volume', { ascending: false })
    .limit(10);

  if (!topPerformers || topPerformers.length === 0) {
    console.log('[Phase2C] No performers found, skipping bonus distribution');
    await supabase.from('bonus_pools').update({ status: 'distributed' }).eq('id', bonusPoolId);
    return;
  }

  for (let i = 0; i < topPerformers.length; i++) {
    const performer = topPerformers[i];
    const rank = i + 1;
    const percentage = BONUS_PERCENTAGES[i];
    const bonusAmount = totalPool * (percentage / 100);

    console.log(`[Phase2C] Rank ${rank}: User ${performer.id} - ${percentage}% = ${bonusAmount}`);

    await supabase.from('bonus_pool_winners').insert({
      bonus_pool_id: bonusPoolId,
      user_id: performer.id,
      rank,
      team_volume: performer.team_volume || 0,
      bonus_amount: bonusAmount,
      percentage_share: percentage
    });

    await supabase.from('transactions').insert({
      user_id: performer.id,
      amount: bonusAmount,
      type: 'performance_bonus',
      description: `Top ${rank} performance bonus ${month}/${year} (${percentage}%)`,
      status: 'completed'
    });

    await supabase.rpc('increment_pending_balance', {
      x_user_id: performer.id,
      x_amount: bonusAmount
    });
  }

  await supabase.from('bonus_pools').update({
    status: 'distributed',
    distributed_at: new Date().toISOString()
  }).eq('id', bonusPoolId);

  console.log(`[Phase2C] Bonus pool distribution complete for ${month}/${year}`);
}
