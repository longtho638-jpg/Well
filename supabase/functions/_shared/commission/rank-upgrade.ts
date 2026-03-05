/* eslint-disable no-console */
/**
 * Rank Upgrade Checker - Admin 3.1 Dynamic Rank Upgrades
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

interface RankUpgrade {
  fromRank: number;
  name: string;
  conditions: {
    salesRequired?: number;
    teamVolumeRequired?: number;
    directDownlinesRequired?: number;
    minDownlineRank?: number;
  };
  toRank: number;
}

interface RankNames {
  [key: number]: string;
}

const RANK_NAMES: RankNames = {
  7: 'Khởi Nghiệp',
  6: 'Đại Sứ',
  5: 'Đại Sứ Silver',
  4: 'Đại Sứ Gold',
  3: 'Đại Sứ Diamond',
  2: 'Phượng Hoàng',
  1: 'Thiên Long'
};

export async function checkAndPerformRankUpgrade(
  supabase: SupabaseClient,
  userId: string,
  buyerRoleId: number,
  rankUpgrades: RankUpgrade[]
) {
  const applicableUpgrade = rankUpgrades.find((upgrade) => upgrade.fromRank === buyerRoleId);

  if (!applicableUpgrade) {
    return;
  }

  console.log(`[RankUp] Checking upgrade: ${applicableUpgrade.name}`);

  const { data: orders } = await supabase
    .from('orders')
    .select('total_vnd')
    .eq('user_id', userId)
    .eq('status', 'completed');

  const lifetimeSales = orders?.reduce((sum: number, o: { total_vnd: string | number }) =>
    sum + Number(o.total_vnd), 0) || 0;

  const { data: userData } = await supabase
    .from('users')
    .select('team_volume')
    .eq('id', userId)
    .single();

  const teamVolume = userData?.team_volume || 0;

  const { data: downlines } = await supabase
    .from('users')
    .select('id, role_id')
    .eq('sponsor_id', userId);

  const directDownlinesCount = downlines?.length || 0;
  let meetsDownlineRankRequirement = true;

  if (applicableUpgrade.conditions.minDownlineRank) {
    const qualifiedDownlines = downlines?.filter(
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (d: { id: string; role_id: number }) => d.role_id <= applicableUpgrade.conditions.minDownlineRank!
    ) || [];
    meetsDownlineRankRequirement = qualifiedDownlines.length >= (applicableUpgrade.conditions.directDownlinesRequired || 0);
  }

  const conditions = applicableUpgrade.conditions;
  const meetsSales = !conditions.salesRequired || lifetimeSales >= conditions.salesRequired;
  const meetsTeamVolume = !conditions.teamVolumeRequired || teamVolume >= conditions.teamVolumeRequired;
  const meetsDownlines = !conditions.directDownlinesRequired || directDownlinesCount >= conditions.directDownlinesRequired;

  if (meetsSales && meetsTeamVolume && meetsDownlines && meetsDownlineRankRequirement) {
    await supabase
      .from('users')
      .update({
        rank: RANK_NAMES[applicableUpgrade.toRank] || 'Unknown',
        role_id: applicableUpgrade.toRank
      })
      .eq('id', userId);

    console.log(`[RankUp] ✅ User ${userId} upgraded: ${applicableUpgrade.name}`);
  }
}
