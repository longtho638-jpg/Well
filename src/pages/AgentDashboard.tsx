import { useState, useEffect } from 'react';
import { useAgentOS } from '@/hooks/useAgentOS';
import { AgentDefinition } from '@/types/agentic';
import { Activity, Zap, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Skeleton } from '@/components/ui/Skeleton';

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
      // showToast('Agent-OS Dashboard Ready', 'success'); // Optional: might be annoying on every load
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const handleAgentClick = (agentName: string) => {
    setSelectedAgent(agentName);
    // showToast(\`Viewing details for \${agentName}\`, 'info');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="mb-8 space-y-2">
          <Skeleton width={300} height={40} />
          <Skeleton width={500} height={20} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow-md p-6">
               <div className="flex items-center justify-between">
                 <div className="space-y-2">
                   <Skeleton width={100} height={16} />
                   <Skeleton width={60} height={36} />
                 </div>
                 <Skeleton variant="circular" width={48} height={48} />
               </div>
            </div>
          ))}
        </div>
        <div className="space-y-6">
           {[1, 2].map((i) => (
             <div key={i} className="bg-white rounded-lg shadow-md p-6 space-y-4">
               <Skeleton width={200} height={28} />
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {[1, 2, 3].map((j) => (
                   <Skeleton key={j} variant="rectangular" height={120} className="rounded-lg" />
                 ))}
               </div>
             </div>
           ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-primary mb-2">Agent-OS Dashboard</h1>
        <p className="text-gray-600">
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
          <div key={functionName} className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4 text-primary">{functionName}</h2>
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
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm">{title}</p>
          <p className="text-3xl font-bold mt-2">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>{icon}</div>
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
        p-4 rounded-lg border-2 cursor-pointer transition-all
        ${isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-primary'}
        ${isCustom ? 'bg-purple-50' : 'bg-white'}
      `}
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-sm">{agent.agent_name}</h3>
        {isCustom && (
          <span className="text-xs bg-purple-500 text-white px-2 py-1 rounded">Custom</span>
        )}
      </div>
      <p className="text-xs text-gray-600 mb-3">
        {agent.primary_objectives[0]?.substring(0, 60)}...
      </p>
      {kpis.length > 0 && (
        <div className="text-xs">
          <span className="font-semibold">{kpis[0].name}:</span>{' '}
          <span className="text-primary">{kpis[0].current || 0}/{kpis[0].target} {kpis[0].unit}</span>
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-2xl font-bold text-primary">{def.agent_name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl">
            ×
          </button>
        </div>

        <div className="space-y-4">
          <Section title="Business Function">
            <p className="text-gray-700">{def.business_function}</p>
          </Section>

          <Section title="Primary Objectives">
            <ul className="list-disc list-inside space-y-1">
              {def.primary_objectives.map((obj, i) => (
                <li key={i} className="text-gray-700">{obj}</li>
              ))}
            </ul>
          </Section>

          <Section title="KPIs">
            {kpis.map((kpi, i) => (
              <div key={i} className="flex justify-between items-center py-2 border-b">
                <span className="font-semibold">{kpi.name}</span>
                <span className="text-primary">
                  {kpi.current || 0} / {kpi.target} {kpi.unit}
                </span>
              </div>
            ))}
          </Section>

          <Section title="Policies">
            {def.policy_and_constraints.map((policy, i) => (
              <div key={i} className="mb-2">
                <span className={`inline-block px-2 py-1 text-xs rounded ${
                  policy.enforcement === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {policy.enforcement.toUpperCase()}
                </span>
                <p className="mt-1 text-sm text-gray-700">{policy.rule}</p>
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
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      {children}
    </div>
  );
}
