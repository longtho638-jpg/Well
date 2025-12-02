# Task for Gemini CLI: Phase 6 - Agent Dashboard UI

## Context
✅ **Phase 1-5 Complete**: Full Agent-OS stack ready

You are implementing **Phase 6**: Creating a UI dashboard to visualize and interact with agents.

---

## Objectives

1. Create an Agent Dashboard component
2. Display all registered agents
3. Show agent KPIs
4. Add route for the dashboard
5. Add navigation link

---

## Task 1: Create `src/pages/AgentDashboard.tsx`

**Implementation:**

```typescript
import { useState } from 'react';
import { useAgentOS } from '@/hooks/useAgentOS';
import { AgentDefinition } from '@/types/agentic';
import { Activity, Zap, BarChart3 } from 'lucide-react';

export default function AgentDashboard() {
  const { listAgents, getTotalAgentCount, getAgentKPIs } = useAgentOS();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  const agents = listAgents();
  const groupedAgents = groupByFunction(agents);

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
                  onClick={() => setSelectedAgent(agent.agent_name)}
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
        <div className={\`\${color} p-3 rounded-lg text-white\`}>{icon}</div>
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
      className={\`
        p-4 rounded-lg border-2 cursor-pointer transition-all
        \${isSelected ? 'border-primary bg-blue-50' : 'border-gray-200 hover:border-primary'}
        \${isCustom ? 'bg-purple-50' : 'bg-white'}
      \`}
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
                <span className={\`inline-block px-2 py-1 text-xs rounded \${
                  policy.enforcement === 'hard' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }\`}>
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
```

---

## Task 2: Add Route in `src/App.tsx`

Find the routes section and add:

```typescript
<Route path="/dashboard/agents" element={<AgentDashboard />} />
```

Import at the top:
```typescript
import AgentDashboard from './pages/AgentDashboard';
```

---

## Task 3: Add Navigation Link in `src/components/Sidebar.tsx`

Find the navigation menu items and add:

```typescript
<a href="/dashboard/agents" className="nav-link">
  <Activity className="w-5 h-5" />
  <span>Agent Dashboard</span>
</a>
```

Import `Activity` from lucide-react if not already imported.

---

## Deliverables

- `src/pages/AgentDashboard.tsx`
- Modified `src/App.tsx` (1 new route)
- Modified `src/components/Sidebar.tsx` (1 new link)

---

## Success Criteria

- ✅ Agent Dashboard page created
- ✅ Route accessible at `/dashboard/agents`
- ✅ Navigation link works
- ✅ Dashboard displays all agents grouped by function
- ✅ KPIs visible for each agent
- ✅ Modal details work
- ✅ `npm run build` succeeds
- ✅ `npm run dev` - dashboard is accessible and functional

---

## Final Verification

After completing Phase 6:

```bash
# Build
npm run build

# Run dev server
npm run dev
```

Navigate to `http://localhost:5173/dashboard/agents` and verify:
- Dashboard loads
- All 22+ agents are displayed
- Clicking an agent shows details
- Navigation works

Proceed with Phase 6 implementation.
