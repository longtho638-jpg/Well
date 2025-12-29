import { agentRegistry } from '@/agents';
import { BaseAgent } from '@/agents/core/BaseAgent';
import { Activity, AlertCircle, CheckCircle2, Clock, Zap, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

interface AgentMetrics {
    name: string;
    status: 'active' | 'idle' | 'error';
    function: string;
    kpis: {
        name: string;
        current: number;
        target: number;
        unit: string;
    }[];
    actions: string[];
}

export function AgentDashboard() {
    const [agents, setAgents] = useState<AgentMetrics[]>([]);

    useEffect(() => {
        // Load all agents from registry
        const allAgents = agentRegistry.getAll();

        const metrics: AgentMetrics[] = allAgents.map(agent => ({
            name: agent.definition.agent_name,
            status: 'active' as const,
            function: agent.definition.business_function,
            kpis: agent.definition.success_kpis,
            actions: agent.definition.core_actions,
        }));

        setAgents(metrics);
    }, []);

    const totalAgents = agents.length;
    const activeAgents = agents.filter(a => a.status === 'active').length;
    const totalKPIs = agents.reduce((sum, a) => sum + a.kpis.length, 0);
    const totalActions = agents.reduce((sum, a) => sum + a.actions.length, 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 p-6 space-y-6">
            {/* Header with gradient */}
            <div className="space-y-2 animate-fade-in">
                <div className="flex items-center gap-3">
                    <Zap className="w-10 h-10 text-purple-600 animate-pulse" />
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        Agent Ecosystem
                    </h1>
                </div>
                <p className="text-gray-600 text-lg">
                    Monitoring <span className="font-bold text-purple-600">{totalAgents}</span> intelligent agents
                </p>
            </div>

            {/* Summary Cards with gradient backgrounds */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-up">
                <div className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-sm opacity-90">Total Agents</p>
                            <p className="text-3xl font-bold">{totalAgents}</p>
                        </div>
                        <Activity className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-sm opacity-90">Active Now</p>
                            <p className="text-3xl font-bold">{activeAgents}</p>
                        </div>
                        <CheckCircle2 className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-sm opacity-90">Total KPIs</p>
                            <p className="text-3xl font-bold">{totalKPIs}</p>
                        </div>
                        <TrendingUp className="w-10 h-10 opacity-80" />
                    </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                    <div className="flex items-center justify-between text-white">
                        <div>
                            <p className="text-sm opacity-90">Total Actions</p>
                            <p className="text-3xl font-bold">{totalActions}</p>
                        </div>
                        <AlertCircle className="w-10 h-10 opacity-80" />
                    </div>
                </div>
            </div>

            {/* Agent Grid with staggered animation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {agents.map((agent, idx) => (
                    <div
                        key={idx}
                        className="p-5 bg-white rounded-xl shadow-md hover:shadow-2xl transition-all transform hover:-translate-y-1 border border-gray-100 animate-fade-in"
                        style={{ animationDelay: `${idx * 50}ms` }}
                    >
                        <div className="space-y-3">
                            {/* Agent Header */}
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-lg text-gray-800">{agent.name}</h3>
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            </div>

                            {/* Business Function with badge */}
                            <div className="inline-block">
                                <span className="px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 rounded-full text-xs font-medium">
                                    {agent.function}
                                </span>
                            </div>

                            {/* KPIs with progress bars */}
                            {agent.kpis.length > 0 && (
                                <div className="space-y-2 pt-2">
                                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Performance</p>
                                    {agent.kpis.slice(0, 3).map((kpi, i) => {
                                        const progress = Math.min((kpi.current / kpi.target) * 100, 100);
                                        return (
                                            <div key={i} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">{kpi.name}</span>
                                                    <span className="font-mono font-semibold text-gray-800">
                                                        {kpi.current}/{kpi.target} {kpi.unit}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                    <div
                                                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500 ease-out"
                                                        style={{ width: `${progress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Actions Count */}
                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <p className="text-xs text-gray-500">
                                    {agent.actions.length} action{agent.actions.length !== 1 ? 's' : ''}
                                </p>
                                <Zap className="w-4 h-4 text-purple-500" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        
        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
        </div>
    );
}
