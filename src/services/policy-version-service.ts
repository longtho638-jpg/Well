import { supabase } from '@/lib/supabase';
import { PolicyConfig } from './policyService';

const STORAGE_KEY = 'wellnexus_policy_versions';
const MAX_STORED_VERSIONS = 50;

export interface PolicyVersion {
  id: string;
  version: number;
  config: PolicyConfig;
  changedBy: string;
  changedAt: string;
  changeDescription: string;
}

export const policyVersionService = {
  async getVersionHistory(limit = 20): Promise<PolicyVersion[]> {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const versions = JSON.parse(stored) as PolicyVersion[];
      return versions.slice(0, limit);
    }
    return [];
  },

  async saveVersion(config: PolicyConfig, description: string): Promise<void> {
    const versions = await this.getVersionHistory(MAX_STORED_VERSIONS);
    const newVersion: PolicyVersion = {
      id: crypto.randomUUID(),
      version: versions.length + 1,
      config,
      changedBy: 'admin',
      changedAt: new Date().toISOString(),
      changeDescription: description,
    };
    versions.unshift(newVersion);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(versions.slice(0, MAX_STORED_VERSIONS)));

    // Also try Supabase (graceful fallback)
    try {
      await supabase.from('policy_versions').insert({
        version: newVersion.version,
        config: newVersion.config,
        changed_by: newVersion.changedBy,
        change_description: newVersion.changeDescription,
      });
    } catch {
      /* Supabase table may not exist yet */
    }
  },

  async rollbackToVersion(versionId: string): Promise<PolicyConfig | null> {
    const versions = await this.getVersionHistory();
    const target = versions.find(v => v.id === versionId);
    return target?.config ?? null;
  },

  diffVersions(oldConfig: PolicyConfig, newConfig: PolicyConfig): string[] {
    const changes: string[] = [];

    if (oldConfig.commissions?.retailComm !== newConfig.commissions?.retailComm) {
      changes.push(
        `Retail Commission: ${oldConfig.commissions?.retailComm}% → ${newConfig.commissions?.retailComm}%`
      );
    }
    if (oldConfig.commissions?.agencyBonus !== newConfig.commissions?.agencyBonus) {
      changes.push(
        `Agency Bonus: ${oldConfig.commissions?.agencyBonus}% → ${newConfig.commissions?.agencyBonus}%`
      );
    }
    if (oldConfig.commissions?.elitePool !== newConfig.commissions?.elitePool) {
      changes.push(
        `Elite Pool: ${oldConfig.commissions?.elitePool}% → ${newConfig.commissions?.elitePool}%`
      );
    }
    if (oldConfig.beeAgentPolicy?.ctvCommission !== newConfig.beeAgentPolicy?.ctvCommission) {
      changes.push(
        `CTV Commission: ${oldConfig.beeAgentPolicy?.ctvCommission}% → ${newConfig.beeAgentPolicy?.ctvCommission}%`
      );
    }
    if (oldConfig.rules?.activationThreshold !== newConfig.rules?.activationThreshold) {
      changes.push(
        `Activation Threshold: ${oldConfig.rules?.activationThreshold} → ${newConfig.rules?.activationThreshold}`
      );
    }

    return changes;
  },
};
