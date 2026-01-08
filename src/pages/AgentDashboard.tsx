import { useState, useEffect } from 'react';
import { useAgentOS } from '@/hooks/useAgentOS';
import { AgentDefinition } from '@/types/agentic';
import { Activity, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';
import { ParticleBackground } from '@/components/ParticleBackground';
import { LiveConsole } from '@/components/LiveConsole';

export default function AgentDashboard() {
  const { listAgents, getTotalAgentCount, getAgentKPIs, getUserRole } = useAgentOS();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdminView, setIsAdminView] = useState(false);
  const [userRole, setUserRole] = useState<string>('Member');
  const { showToast } = useToast();

  const agents = listAgents();

  // Filter agents based on view mode
  const visibleAgents = agents.filter(agent => {
    if (isAdminView) return true; // Admin sees everything
    return agent.visibility === 'user' || agent.visibility === 'all';
  });

  const groupedAgents = groupByFunction(visibleAgents);

  useEffect(() => {
    // Simulate initial data loading & Role Check
    const init = async () => {
      const role = await getUserRole();
      setUserRole(role);

      // Auto-enable Admin View if Partner (Optional, or keep off by default)
      // if (role === 'Partner') setIsAdminView(true);

      setIsLoading(false);
    };

    setTimeout(init, 800);
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
        {/* Header & Live Console */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Agent-OS Command Center</h1>
            <p className="text-white/60">
              Manage and monitor {getTotalAgentCount()} active agents across all business functions.
            </p>
            <div className="mt-4 flex gap-3">
              <div className="px-3 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                SYSTEM OPTIMAL
              </div>
              <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold">
                VERSION 1.0.0 (SEED)
              </div>

              {/* Admin Toggle (Only visible to Partners/Admins) */}
              {/* For Demo purposes, we might want to let YOU see it, but hide for others.
                  Since we mocked getUserRole to 'Member', this will be HIDDEN by default.
                  To see it, we need to be 'Partner'.
              */}
              {(userRole === 'Partner' || userRole === 'Admin') && (
                <button
                  onClick={() => setIsAdminView(!isAdminView)}
                  className={`px-3 py-1 rounded-full border text-xs font-bold transition-all ${isAdminView
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-400'
                    : 'bg-white/5 border-white/10 text-white/40 hover:text-white/80'
                    }`}
                >
                  {isAdminView ? 'ADMIN VIEW: ON' : 'ADMIN VIEW: OFF'}
                </button>
              )}
            </div>
          </div>
          <div className="w-full">
            <LiveConsole />
          </div>
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
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  color: string;
}

function StatCard({ icon, title, value, color }: StatCardProps) {
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
interface AgentCardProps {
  agent: AgentDefinition;
  isSelected: boolean;
  onClick: () => void;
  getKPIs: (agentName: string) => any[]; // Ideally define KPI type too
}

function AgentCard({ agent, isSelected, onClick, getKPIs }: AgentCardProps) {
  const kpis = getKPIs(agent.agent_name);
  const isCustom = !agent.agent_name.includes('expert');
  const isActive = agent.agent_name === 'The Bee'; // Only The Bee is truly active

  // Fake Training Progress for WOW effect
  const trainingProgress = Math.floor(Math.random() * 30) + 60; // 60-90%

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border cursor-pointer transition-all duration-300 relative overflow-hidden group
        ${isSelected ? 'border-teal-500 bg-teal-500/10' : 'border-white/10 hover:border-white/30 bg-white/5'}
      `}
    >
      {/* Background Pulse for Active Agent */}
      {isActive && (
        <div className="absolute inset-0 bg-yellow-500/5 animate-pulse pointer-events-none"></div>
      )}

      <div className="flex items-start justify-between mb-3 relative z-10">
        <h3 className="font-semibold text-sm text-white flex items-center gap-2">
          {agent.agent_name}
          {isActive ? (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></span>
          ) : (
            <span className="w-2 h-2 rounded-full bg-blue-500/50"></span>
          )}
        </h3>
        <div className="flex gap-1">
          {isActive ? (
            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold border border-green-500/30">ACTIVE</span>
          ) : (
            <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full font-bold border border-blue-500/20 flex items-center gap-1">
              <span className="animate-spin">⟳</span> TRAINING
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-white/60 mb-4 line-clamp-2 h-8">
        {agent.primary_objectives[0]}
      </p>

      {/* KPI or Training Progress */}
      {isActive ? (
        kpis.length > 0 && (
          <div className="text-xs text-white/80 bg-black/20 p-2 rounded-lg border border-white/5">
            <div className="flex justify-between mb-1">
              <span className="font-semibold text-teal-400">{kpis[0].name}</span>
              <span>{kpis[0].current || 0}/{kpis[0].target}</span>
            </div>
            <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden">
              <div className="h-full bg-teal-500" style={{ width: '100%' }}></div>
            </div>
          </div>
        )
      ) : (
        <div className="text-xs text-white/80 bg-blue-500/5 p-2 rounded-lg border border-blue-500/10">
          <div className="flex justify-between mb-1 text-[10px] uppercase tracking-wider text-blue-300/70">
            <span>Neural Training</span>
            <span>{trainingProgress}%</span>
          </div>
          <div className="w-full bg-blue-900/30 h-1 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500/50 relative overflow-hidden"
              style={{ width: `${trainingProgress}%` }}
            >
              <div className="absolute inset-0 bg-white/20 animate-[shimmer_1s_infinite] skew-x-12"></div>
            </div>
          </div>
          <div className="mt-1 text-[9px] text-blue-400/50 truncate">
            Processing dataset batch #{Math.floor(Math.random() * 9000) + 1000}...
          </div>
        </div>
      )}
    </div>
  );
}

// Agent Details Modal
interface AgentDetailsModalProps {
  agentName: string;
  onClose: () => void;
  getKPIs: (agentName: string) => any[];
}

function AgentDetailsModal({ agentName, onClose, getKPIs }: AgentDetailsModalProps) {
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
                <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase mb-1 ${policy.enforcement === 'hard' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'
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
