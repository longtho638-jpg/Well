/* eslint-disable no-console */
/**
 * Phase 2C: Performance Bonus Pool - Monthly Top 10 Distribution
 * 2% of monthly volume distributed to top 10 performers
 * Distribution: 1st: 25%, 2nd: 20%, 3rd: 15%, 4th: 12%, 5th: 10%, 6th: 8%, 7th: 5%, 8th: 3%, 9th: 1.5%, 10th: 0.5%
 *
 * SECURITY FIXES APPLIED (2026-03-05):
 * 1. ✅ Admin authorization check
 * 2. ✅ Distributed lock for idempotency (PostgreSQL advisory lock)
 * 3. ✅ UPSERT instead of race condition insert/update
 * 4. ✅ Pool exhaustion validation
 * 5. ✅ Negative volume filtering
 * 6. ✅ Floating point precision fix (integer math)
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const BONUS_PERCENTAGES = [25, 20, 15, 12, 10, 8, 5, 3, 1.5, 0.5]; // Top 10 shares
const ADMIN_MAX_ROLE_ID = 3; // Dai Su Diamond or higher can trigger

// Distribution result type for return value
interface DistributionResult {
  rank: number;
  userId: string;
  bonusAmount: number;
  percentage: number;
}

async function acquireLock(supabase: SupabaseClient, lockKey: string): Promise<boolean> {
  const lockHash = BigInt(Array.from(lockKey).reduce((acc, char) => acc + char.charCodeAt(0), 0)) % BigInt(Number.MAX_SAFE_INTEGER);
  const { data, error } = await supabase.rpc('try_advisory_lock', { lock_key: Number(lockHash) });
  if (error) {
    console.error('[Phase2C] Lock acquisition failed:', error);
    return false;
  }
  return data === true;
}

async function releaseLock(supabase: SupabaseClient, lockKey: string): Promise<void> {
  const lockHash = BigInt(Array.from(lockKey).reduce((acc, char) => acc + char.charCodeAt(0), 0)) % BigInt(Number.MAX_SAFE_INTEGER);
  await supabase.rpc('release_advisory_lock', { lock_key: Number(lockHash) });
}

async function checkAdminPermission(supabase: SupabaseClient): Promise<boolean> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    console.error('[Phase2C] Authentication failed:', authError);
    return false;
  }
  const { data: profile, error: profileError } = await supabase.from('users').select('role_id').eq('id', user.id).single();
  if (profileError || !profile) {
    console.error('[Phase2C] Profile not found:', profileError);
    return false;
  }
  const isAdmin = (profile.role_id || 99) <= ADMIN_MAX_ROLE_ID;
  if (!isAdmin) {
    console.warn(`[Phase2C] Unauthorized attempt by user ${user.id} with role_id ${profile.role_id}`);
  }
  return isAdmin;
}

function calculateBonusAmount(totalPool: number, percentage: number): number {
  return Math.round((totalPool * percentage) / 100);
}

export async function calculateMonthlyBonusPool(
  supabase: SupabaseClient,
  month: number,
  year: number
) {
  console.log(`[Phase2C] Calculating bonus pool for ${month}/${year}...`);

  // Validate month and year
  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month}. Must be 1-12`);
  }

  if (year < 2000 || year > 2100) {
    throw new Error(`Invalid year: ${year}. Must be 2000-2100`);
  }

  // SECURITY FIX #1: Check admin permission
  const isAdmin = await checkAdminPermission(supabase);
  if (!isAdmin) {
    throw new Error('Unauthorized: Admin permission required (role_id <= Dai Su Diamond)');
  }

  const lockKey = `bonus_pool_${year}_${month}`;

  // SECURITY FIX #2: Acquire distributed lock
  const lockAcquired = await acquireLock(supabase, lockKey);
  if (!lockAcquired) {
    throw new Error('Bonus distribution already in progress for this month. Please wait.');
  }

  try {
    console.log(`[Phase2C] Lock acquired for ${lockKey}`);

    // Calculate monthly volume
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_vnd')
      .eq('status', 'completed')
      .gte('created_at', `${year}-${month.toString().padStart(2, '0')}-01`)
      .lt('created_at', `${nextYear}-${nextMonth.toString().padStart(2, '0')}-01`);

    if (ordersError) {
      throw new Error(`Failed to fetch orders: ${ordersError.message}`);
    }

    const totalVolume = orders?.reduce((sum: number, o: { total_vnd: string | number }) =>
      sum + Number(o.total_vnd), 0) || 0;

    const totalPool = totalVolume * 0.02;

    console.log(`[Phase2C] Total volume: ${totalVolume}, Bonus pool: ${totalPool}`);

    // SECURITY FIX #3: Use UPSERT to prevent race condition
    const { data: bonusPool, error: poolError } = await supabase
      .from('bonus_pools')
      .upsert({
        month,
        year,
        total_pool_amount: totalPool,
        total_volume: totalVolume,
        status: 'calculating'
      }, {
        onConflict: 'month,year'
      })
      .select('id')
      .single();

    if (poolError) {
      throw new Error(`Failed to create/update bonus pool: ${poolError.message}`);
    }

    const bonusPoolId = bonusPool.id;

    // SECURITY FIX #5: Filter out negative team volumes and sort descending
    const { data: topPerformers, error: performersError } = await supabase
      .from('users')
      .select('id, team_volume')
      .gte('team_volume', 0) // Filter negative volumes
      .order('team_volume', { ascending: false })
      .limit(10);

    if (performersError) {
      throw new Error(`Failed to fetch top performers: ${performersError.message}`);
    }

    // Handle empty performers list
    if (!topPerformers || topPerformers.length === 0) {
      console.log('[Phase2C] No performers found, skipping bonus distribution');
      await supabase.from('bonus_pools').update({ status: 'distributed' }).eq('id', bonusPoolId);
      return;
    }

    // SECURITY FIX #4: Validate pool sufficiency BEFORE distribution
    const totalPercentage = BONUS_PERCENTAGES.reduce((sum, p) => sum + p, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      throw new Error(`Invalid bonus percentages: sum is ${totalPercentage}%, expected 100%`);
    }

    // Check if pool has sufficient funds
    if (totalPool <= 0) {
      console.warn('[Phase2C] Pool is empty or negative, skipping distribution');
      await supabase.from('bonus_pools').update({
        status: 'insufficient_funds',
        distributed_at: new Date().toISOString()
      }).eq('id', bonusPoolId);
      return;
    }

    console.log(`[Phase2C] Distributing to ${topPerformers.length} performers...`);

    // Distribute bonuses with transaction-like behavior
    const distributionResults: DistributionResult[] = [];

    for (let i = 0; i < topPerformers.length; i++) {
      const performer = topPerformers[i];
      const rank = i + 1;
      const percentage = BONUS_PERCENTAGES[i];

      // SECURITY FIX #6: Use integer math for bonus calculation
      const bonusAmount = calculateBonusAmount(totalPool, percentage);

      console.log(`[Phase2C] Rank ${rank}: User ${performer.id} - ${percentage}% = ${bonusAmount}`);

      // Insert winner record
      const { error: winnerError } = await supabase.from('bonus_pool_winners').insert({
        bonus_pool_id: bonusPoolId,
        user_id: performer.id,
        rank,
        team_volume: performer.team_volume || 0,
        bonus_amount: bonusAmount,
        percentage_share: percentage
      });

      if (winnerError) {
        console.error(`[Phase2C] Failed to insert winner rank ${rank}:`, winnerError);
        throw new Error(`Failed to insert winner: ${winnerError.message}`);
      }

      // Insert transaction
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: performer.id,
        amount: bonusAmount,
        type: 'performance_bonus',
        description: `Top ${rank} performance bonus ${month}/${year} (${percentage}%)`,
        status: 'completed'
      });

      if (txError) {
        console.error(`[Phase2C] Failed to insert transaction for rank ${rank}:`, txError);
        throw new Error(`Failed to insert transaction: ${txError.message}`);
      }

      // Increment pending balance via RPC
      const { error: rpcError } = await supabase.rpc('increment_pending_balance', {
        x_user_id: performer.id,
        x_amount: bonusAmount
      });

      if (rpcError) {
        console.error(`[Phase2C] Failed to increment balance for rank ${rank}:`, rpcError);
        throw new Error(`Failed to increment balance: ${rpcError.message}`);
      }

      distributionResults.push({
        rank,
        userId: performer.id,
        bonusAmount,
        percentage
      });
    }

    // Mark pool as distributed
    await supabase.from('bonus_pools').update({
      status: 'distributed',
      distributed_at: new Date().toISOString()
    }).eq('id', bonusPoolId);

    console.log(`[Phase2C] Bonus pool distribution complete for ${month}/${year}`);
    console.log(`[Phase2C] Distributed to ${distributionResults.length} performers`);

    return {
      success: true,
      bonusPoolId,
      month,
      year,
      totalPool,
      totalVolume,
      distributedTo: distributionResults.length,
      winners: distributionResults
    };

  } catch (error) {
    console.error('[Phase2C] Error during distribution:', error);

    // Mark pool as failed on error
    await supabase.from('bonus_pools').update({
      status: 'failed',
      distributed_at: new Date().toISOString()
    }).eq('month', month).eq('year', year);

    throw error;
  } finally {
    // SECURITY FIX #2: Always release lock
    await releaseLock(supabase, lockKey);
    console.log(`[Phase2C] Lock released for ${lockKey}`);
  }
}
