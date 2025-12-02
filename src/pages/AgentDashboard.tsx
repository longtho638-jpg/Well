import { useState, useEffect } from 'react';
import { useAgentOS } from '@/hooks/useAgentOS';
import { AgentDefinition } from '@/types/agentic';
import { Activity, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { ParticleBackground } from '@/components/ParticleBackground';

export default function AgentDashboard() {
  const { listAgents, getTotalAgentCount, getAgentKPIs } = useAgentOS();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const agents = listAgents();
  const groupedAgents = groupByFunction(agents);

  useEffect(() => {
    // Simulate initial data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAgentClick = (agentName: string) => {
    setSelectedAgent(agentName);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-ultra p-6 relative overflow-hidden">
        <div className="relative z-10">
            <div className="mb-8 space-y-2">
            <Skeleton width={300} height={40} className="bg-white/10" />
            <Skeleton width={500} height={20} className="bg-white/5" />
            </div>
            {/* ... Skeletons ... */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-ultra p-6 relative overflow-hidden">
      <ParticleBackground />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Agent-OS Dashboard</h1>
            <p className="text-white/60">
            Manage and monitor {getTotalAgentCount()} active agents across all business functions
            </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCard
            icon={<Activity className="w-6 h-6" />}
            title="Total Agents"
            value={getTotalAgentCount()}
            color="bg-blue-500"
            />
            <StatCard
            icon={<Zap className="w-6 h-6" />}
            title="Active Functions"
            value={Object.keys(groupedAgents).length}
            color="bg-green-500"
            />
            <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="Custom Agents"
            value={agents.filter((a) => !a.agent_name.includes('expert')).length}
            color="bg-purple-500"
            />
        </div>

        {/* Agent List by Function */}
        <div className="space-y-6">
            {Object.entries(groupedAgents).map(([functionName, functionAgents]) => (
            <div key={functionName} className="glass-ultra rounded-3xl p-6">
                <h2 className="text-xl font-bold mb-4 text-teal-400">{functionName}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {functionAgents.map((agent) => (
                    <AgentCard
                    key={agent.agent_name}
                    agent={agent}
                    isSelected={selectedAgent === agent.agent_name}
                    onClick={() => handleAgentClick(agent.agent_name)}
                    getKPIs={getAgentKPIs}
                    />
                ))}
                </div>
            </div>
            ))}
        </div>

        {/* Agent Details Modal (if selected) */}
        {selectedAgent && (
            <AgentDetailsModal
            agentName={selectedAgent}
            onClose={() => setSelectedAgent(null)}
            getKPIs={getAgentKPIs}
            />
        )}
      </div>
    </div>
  );
}

// Helper function
function groupByFunction(agents: AgentDefinition[]) {
  return agents.reduce((acc, agent) => {
    const fn = agent.business_function;
    if (!acc[fn]) acc[fn] = [];
    acc[fn].push(agent);
    return acc;
  }, {} as Record<string, AgentDefinition[]>);
}

// Stat Card Component
function StatCard({ icon, title, value, color }: any) {
  return (
    <div className="glass-ultra rounded-2xl p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-white/60 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2 text-white">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-xl text-white shadow-lg`}>{icon}</div>
      </div>
    </div>
  );
}

// Agent Card Component
function AgentCard({ agent, isSelected, onClick, getKPIs }: any) {
  const kpis = getKPIs(agent.agent_name);
  const isCustom = !agent.agent_name.includes('expert');

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border cursor-pointer transition-all duration-300
        ${isSelected ? 'border-teal-500 bg-teal-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm text-white">{agent.agent_name}</h3>
        {isCustom && (
          <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded-full font-bold">Custom</span>
        )}
      </div>
      <p className="text-xs text-white/60 mb-3 line-clamp-2">
        {agent.primary_objectives[0]}
      </p>
      {kpis.length > 0 && (
        <div className="text-xs text-white/80">
          <span className="font-semibold text-teal-400">{kpis[0].name}:</span>{' '}
          <span>{kpis[0].current || 0}/{kpis[0].target} {kpis[0].unit}</span>
        </div>
      )}
    </div>
  );
}

// Agent Details Modal
function AgentDetailsModal({ agentName, onClose, getKPIs }: any) {
  const { getAgent } = useAgentOS();
  const agent = getAgent(agentName);
  const kpis = getKPIs(agentName);

  if (!agent) return null;
  const def = agent.getDefinition();

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="glass-dark rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8 border border-white/10 shadow-2xl">
        <div className="flex items-start justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{def.agent_name}</h2>
          <button onClick={onClose} className="text-white/60 hover:text-white text-2xl transition-colors">
            ×
          </button>
        </div>

        <div className="space-y-6">
          <Section title="Business Function">
            <p className="text-white/80">{def.business_function}</p>
          </Section>

          <Section title="Primary Objectives">
            <ul className="list-disc list-inside space-y-2">
              {def.primary_objectives.map((obj, i) => (
                <li key={i} className="text-white/80 text-sm">{obj}</li>
              ))}
            </ul>
          </Section>

          <Section title="KPIs">
            {kpis.map((kpi, i) => (
              <div key={i} className="flex justify-between items-center py-3 border-b border-white/10 last:border-0">
                <span className="font-semibold text-white/90">{kpi.name}</span>
                <span className="text-teal-400 font-mono">
                  {kpi.current || 0} / {kpi.target} {kpi.unit}
                </span>
              </div>
            ))}
          </Section>

          <Section title="Policies">
            {def.policy_and_constraints.map((policy, i) => (
              <div key={i} className="mb-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase mb-1 ${
                  policy.enforcement === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
                }`}>
                  {policy.enforcement}
                </span>
                <p className="text-sm text-white/80">{policy.rule}</p>
              </div>
            ))}
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-bold text-lg mb-3 text-white border-b border-white/10 pb-2">{title}</h3>
      {children}
    </div>
  );
}