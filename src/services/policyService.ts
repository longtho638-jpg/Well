import { supabase } from '@/lib/supabase';
import { adminLogger } from '@/utils/logger';

export interface RankUpgrade {
    fromRank: number;
    toRank: number;
    name: string;
    conditions: {
        salesRequired?: number;
        teamVolumeRequired?: number;
        directDownlinesRequired?: number;
        minDownlineRank?: number;
    };
}

export interface PolicyConfig {
    commissions?: {
        retailComm?: number;
        agencyBonus?: number;
        elitePool?: number;
    };
    rules?: {
        activationThreshold?: number;
        whiteLabelGMV?: number;
        whiteLabelPartners?: number;
    };
    beeAgentPolicy?: {
        ctvCommission?: number;
        startupCommission?: number;
        sponsorBonus?: number;
        rankUpThreshold?: number;
    };
    rankUpgrades?: RankUpgrade[];
}

export const policyService = {
    /**
     * Retrieve global policy configuration
     * Fetches commission rates, rules, and rank requirements.
     */
    async fetchPolicy(): Promise<PolicyConfig | null> {
        try {
            const { data, error } = await supabase
                .from('policy_config')
                .select('value')
                .eq('key', 'global_policy')
                .single();

            if (error) throw error;
            return data?.value as PolicyConfig;
        } catch (error) {
            adminLogger.error('Error fetching policy config', error);
            return null;
        }
    },

    /**
     * Update global policy configuration
     * Requires 'admin' role via RLS.
     * @param config - New policy configuration object
     */
    async savePolicy(config: PolicyConfig): Promise<void> {
        const { data: { session } } = await supabase.auth.getSession();

        const { error } = await supabase
            .from('policy_config')
            .update({
                value: config,
                updated_at: new Date().toISOString(),
                updated_by: session?.user?.id || null
            })
            .eq('key', 'global_policy');

        if (error) throw error;
    }
};
