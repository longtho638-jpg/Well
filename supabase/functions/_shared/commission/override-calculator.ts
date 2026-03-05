/* eslint-disable no-console */
/**
 * Phase 2A: F2-F5 Override Commission - Upline Traversal Logic
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface OverrideConfig {
  minRankId: number;
  percent: number;
  teamVolumeThreshold: number;
}

interface Policy {
  RANKS: Record<string, number>;
  OVERRIDES: Record<string, OverrideConfig>;
}

export async function calculateOverrideCommissions(
  supabase: SupabaseClient,
  _buyerId: string,
  buyerSponsorId: string | null,
  orderTotal: number,
  orderId: string,
  POLICY: Policy
) {
  console.log('[Phase2A] Calculating F2-F5 override commissions...');

  let currentUplineId = buyerSponsorId;
  const processedUplines = new Set<string>();

  while (currentUplineId && !processedUplines.has(currentUplineId)) {
    processedUplines.add(currentUplineId);

    const { data: upline } = await supabase
      .from("profiles")
      .select("id, role_id, sponsor_id")
      .eq("id", currentUplineId)
      .single();

    if (!upline) {
      console.log(`[Phase2A] Upline ${currentUplineId} not found, stopping traversal`);
      break;
    }

    const uplineRoleId = upline.role_id || POLICY.RANKS.CTV;

    for (const [levelName, overrideConfig] of Object.entries(POLICY.OVERRIDES)) {
      if (levelName === 'F1') continue;

      const config = overrideConfig as OverrideConfig;

      if (uplineRoleId > config.minRankId) {
        continue;
      }

      const { data: uplineUserData } = await supabase
        .from('users')
        .select('team_volume')
        .eq('id', currentUplineId)
        .single();

      const uplineTeamVolume = uplineUserData?.team_volume || 0;

      if (uplineTeamVolume < config.teamVolumeThreshold) {
        console.log(`[Phase2A] Upline ${currentUplineId} (${levelName}) team vol ${uplineTeamVolume} < threshold ${config.teamVolumeThreshold}`);
        continue;
      }

      const overrideAmount = orderTotal * config.percent;

      console.log(`[Phase2A] ${levelName}: Upline ${currentUplineId} rank ${uplineRoleId} qualifies for ${config.percent * 100}% = ${overrideAmount}`);

      await supabase.from("transactions").insert({
        user_id: currentUplineId,
        amount: overrideAmount,
        type: `override_${levelName.toLowerCase()}`,
        description: `${levelName} override ${config.percent * 100}% từ đơn hàng ${orderId}`,
        status: "completed"
      });

      await supabase.rpc("increment_pending_balance", {
        x_user_id: currentUplineId,
        x_amount: overrideAmount
      });

      break;
    }

    currentUplineId = upline.sponsor_id;
  }

  console.log('[Phase2A] F2-F5 override commission traversal complete');
}
