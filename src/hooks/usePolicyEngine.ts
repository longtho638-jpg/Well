import { useState, useEffect, useCallback, useMemo } from 'react';
import { policyService, PolicyConfig, RankUpgrade } from '@/services/policyService';
import { adminLogger } from '@/utils/logger';

export function usePolicyEngine() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<string | null>(null);

    // Commission State
    const [retailComm, setRetailComm] = useState(25);
    const [agencyBonus, setAgencyBonus] = useState(10);
    const [elitePool, setElitePool] = useState(3);

    // Rules State
    const [activationThreshold, setActivationThreshold] = useState(6000000);
    const [whiteLabelGMV, setWhiteLabelGMV] = useState(1000000000);
    const [whiteLabelPartners, setWhiteLabelPartners] = useState(50);

    // Bee Agent State
    const [ctvCommission, setCtvCommission] = useState(21);
    const [startupCommission, setStartupCommission] = useState(25);
    const [sponsorBonus, setSponsorBonus] = useState(8);
    const [rankUpThreshold, setRankUpThreshold] = useState(9900000);

    // Rank Upgrades State
    const [rankUpgrades, setRankUpgrades] = useState<RankUpgrade[]>([]);

    // Simulation State
    const [simPartners, setSimPartners] = useState(1000);
    const [simAOV, setSimAOV] = useState(1500000);
    const [fixedCost, setFixedCost] = useState(500000000);

    const loadPolicy = useCallback(async () => {
        setLoading(true);
        try {
            const config = await policyService.fetchPolicy();
            if (config) {
                if (config.commissions) {
                    setRetailComm(config.commissions.retailComm || 25);
                    setAgencyBonus(config.commissions.agencyBonus || 10);
                    setElitePool(config.commissions.elitePool || 3);
                }
                if (config.rules) {
                    setActivationThreshold(config.rules.activationThreshold || 6000000);
                    setWhiteLabelGMV(config.rules.whiteLabelGMV || 1000000000);
                    setWhiteLabelPartners(config.rules.whiteLabelPartners || 50);
                }
                if (config.beeAgentPolicy) {
                    setCtvCommission(config.beeAgentPolicy.ctvCommission || 21);
                    setStartupCommission(config.beeAgentPolicy.startupCommission || 25);
                    setSponsorBonus(config.beeAgentPolicy.sponsorBonus || 8);
                    setRankUpThreshold(config.beeAgentPolicy.rankUpThreshold || 9900000);
                }
                if (config.rankUpgrades) {
                    setRankUpgrades(config.rankUpgrades);
                }
            }
        } catch (error) {
            adminLogger.error('Failed to load platform policy', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPolicy();
    }, [loadPolicy]);

    /**
     * Strategic Policy Committer
     */
    const handleSave = useCallback(async () => {
        setSaving(true);
        try {
            const config: PolicyConfig = {
                commissions: { retailComm, agencyBonus, elitePool },
                rules: { activationThreshold, whiteLabelGMV, whiteLabelPartners },
                beeAgentPolicy: { ctvCommission, startupCommission, sponsorBonus, rankUpThreshold },
                rankUpgrades
            };
            await policyService.savePolicy(config);
            setLastSaved(new Date().toLocaleTimeString('vi-VN'));
            return true;
        } catch (error) {
            adminLogger.error('Critical: Failed to persist policy configuration', error);
            return false;
        } finally {
            setSaving(false);
        }
    }, [retailComm, agencyBonus, elitePool, activationThreshold, whiteLabelGMV, whiteLabelPartners, ctvCommission, startupCommission, sponsorBonus, rankUpThreshold, rankUpgrades]);

    /**
     * Type-safe Rank Upgrade Condition Modifier
     */
    const updateRankUpgrade = useCallback((index: number, updates: Partial<RankUpgrade['conditions']>) => {
        setRankUpgrades(prev => {
            const next = [...prev];
            next[index] = {
                ...next[index],
                conditions: {
                    ...next[index].conditions,
                    ...updates
                }
            };
            return next;
        });
    }, []);

    const totalPayoutPercent = useMemo(() => retailComm + agencyBonus + elitePool, [retailComm, agencyBonus, elitePool]);
    const isRisk = useMemo(() => totalPayoutPercent > 45, [totalPayoutPercent]);

    const simulation = useMemo(() => {
        const simGMV = simPartners * simAOV;
        const simTotalPayout = simGMV * (totalPayoutPercent / 100);
        const simProfit = simGMV - simTotalPayout - fixedCost;
        const profitMargin = simGMV > 0 ? (simProfit / simGMV) * 100 : 0;

        // Strategic Forecast
        const strategicCandidates = Math.floor(simPartners * 0.015); // 1.5%
        const projectedSaaSRevenue = strategicCandidates * whiteLabelGMV * 0.20; // 20%

        return {
            simGMV,
            simTotalPayout,
            simProfit,
            profitMargin,
            strategicCandidates,
            projectedSaaSRevenue
        };
    }, [simPartners, simAOV, fixedCost, totalPayoutPercent, whiteLabelGMV]);

    return {
        loading,
        saving,
        lastSaved,
        commissions: {
            retailComm,
            setRetailComm,
            agencyBonus,
            setAgencyBonus,
            elitePool,
            setElitePool,
            totalPayoutPercent,
            isRisk
        },
        rules: {
            activationThreshold,
            setActivationThreshold,
            whiteLabelGMV,
            setWhiteLabelGMV,
            whiteLabelPartners,
            setWhiteLabelPartners
        },
        beeAgent: {
            ctvCommission,
            setCtvCommission,
            startupCommission,
            setStartupCommission,
            sponsorBonus,
            setSponsorBonus,
            rankUpThreshold,
            setRankUpThreshold
        },
        rankUpgrades,
        updateRankUpgrade,
        simulation: {
            ...simulation,
            simPartners,
            setSimPartners,
            simAOV,
            setSimAOV,
            fixedCost,
            setFixedCost
        },
        handleSave
    };
}
