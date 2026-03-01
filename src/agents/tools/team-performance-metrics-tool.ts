/**
 * Team performance metrics tool for agents
 * Fetches distributor team size, volume, and top performer from Supabase
 */
import { z } from 'zod';
import type { AgentTool } from './agent-tool-types';
import { supabase } from '@/lib/supabase';

const TeamMetricsParamsSchema = z.object({
  userId: z.string(),
});

type TeamMetricsParams = z.infer<typeof TeamMetricsParamsSchema>;

interface TeamMetricsResult {
  directMembers: number;
  totalNetwork: number;
  teamVolume: number;
  topPerformer: string | null;
}

export const teamMetricsTool: AgentTool<TeamMetricsParams, TeamMetricsResult> = {
  name: 'getTeamMetrics',
  description: 'Lấy chỉ số hiệu suất đội nhóm của nhà phân phối',
  parameters: TeamMetricsParamsSchema,
  execute: async ({ userId }) => {
    const { data: members, error } = await supabase
      .from('team_members')
      .select('id, name, total_sales')
      .eq('sponsor_id', userId);

    if (error) throw new Error(`Team metrics failed: ${error.message}`);

    const memberList = members ?? [];
    const sorted = [...memberList].sort(
      (a, b) => ((b.total_sales as number) ?? 0) - ((a.total_sales as number) ?? 0)
    );

    return {
      directMembers: memberList.length,
      totalNetwork: memberList.length, // simplified — full recursive needs Edge Function
      teamVolume: memberList.reduce((sum, m) => sum + ((m.total_sales as number) ?? 0), 0),
      topPerformer: (sorted[0]?.name as string) ?? null,
    };
  },
};
