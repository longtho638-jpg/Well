/**
 * Agent Center State Orchestration Hook
 * Manages agent telemetry, filtering, and execution orchestration.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAgentOS } from '@/hooks/useAgentOS';
import { AgentDefinition } from '@/types/agentic';
import { useTranslation } from '@/hooks';

export function useAgentCenter() {
    const { t } = useTranslation();
    const { listAgents, getTotalAgentCount, getAgentKPIs, getUserRole } = useAgentOS();
    const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isAdminView, setIsAdminView] = useState(false);
    const [userRole, setUserRole] = useState<string>('Member');

    const agents = useMemo(() => listAgents(), [listAgents]);

    // Filter agents based on view mode and visibility
    const visibleAgents = useMemo(() => {
        return agents.filter(agent => {
            if (isAdminView) return true;
            return agent.visibility === 'user' || agent.visibility === 'all';
        });
    }, [agents, isAdminView]);

    const groupedAgents = useMemo(() => {
        return visibleAgents.reduce((acc, agent) => {
            const fn = agent.business_function;
            if (!acc[fn]) acc[fn] = [];
            acc[fn].push(agent);
            return acc;
        }, {} as Record<string, AgentDefinition[]>);
    }, [visibleAgents]);

    useEffect(() => {
        const init = async () => {
            const role = await getUserRole();
            setUserRole(role);
            setIsLoading(false);
        };
        const timer = setTimeout(init, 800);
        return () => clearTimeout(timer);
    }, [getUserRole]);

    const stats = useMemo(() => [
        {
            label: t('agentDashboard.stats.totalAgents'),
            value: getTotalAgentCount(),
            color: 'blue',
            growth: '+2'
        },
        {
            label: t('agentDashboard.stats.activeFunctions'),
            value: Object.keys(groupedAgents).length,
            color: 'emerald',
            growth: 'Stable'
        },
        {
            label: t('agentDashboard.stats.customAgents'),
            value: agents.filter(a => !a.agent_name.includes('expert')).length,
            color: 'purple',
            growth: '+1'
        }
    ], [agents, groupedAgents, getTotalAgentCount, t]);

    const handleAgentClick = useCallback((agentName: string) => {
        setSelectedAgent(agentName);
    }, []);

    const closeDetails = useCallback(() => {
        setSelectedAgent(null);
    }, []);

    const toggleAdminView = useCallback(() => {
        setIsAdminView(prev => !prev);
    }, []);

    return {
        agents,
        visibleAgents,
        groupedAgents,
        stats,
        selectedAgent,
        isLoading,
        isAdminView,
        userRole,
        handleAgentClick,
        closeDetails,
        toggleAdminView,
        getAgentKPIs,
        t
    };
}
