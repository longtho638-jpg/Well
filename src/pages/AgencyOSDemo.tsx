import React, { useState, useEffect } from 'react';
import { Command, Zap, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { agentRegistry } from '@/agents';
import { AGENCYOS_COMMANDS, AgencyOSCategory } from '@/agents/custom/AgencyOSAgent';
import CommandPalette from '@/components/ui/CommandPalette';

const CATEGORY_COLORS: Record<AgencyOSCategory, string> = {
    marketing: 'from-pink-500 to-rose-500',
    sales: 'from-blue-500 to-cyan-500',
    finance: 'from-green-500 to-emerald-500',
    operations: 'from-purple-500 to-violet-500',
    strategy: 'from-orange-500 to-amber-500',
    agents: 'from-indigo-500 to-blue-500',
};

const CATEGORY_ICONS: Record<AgencyOSCategory, string> = {
    marketing: '📣',
    sales: '💼',
    finance: '💰',
    operations: '⚙️',
    strategy: '🎯',
    agents: '🤖',
};

export function AgencyOSDemo() {
    const [isPaletteOpen, setIsPaletteOpen] = useState(false);
    const [selectedCategory, setSelectedCategory] = useState<AgencyOSCategory | null>(null);
    const [executionLog, setExecutionLog] = useState<any[]>([]);
    const [agentKPIs, setAgentKPIs] = useState<any>(null);

    // Load agent KPIs
    useEffect(() => {
        const agent = agentRegistry.get('AgencyOS');
        if (agent) {
            setAgentKPIs(agent.getKPIs());
        }
    }, []);

    // Demo command execution
    const runDemoCommand = async (command: string) => {
        const agent = agentRegistry.get('AgencyOS');
        if (!agent) return;

        const result = await agent.execute({
            action: 'executeCommand',
            command,
        });

        setExecutionLog(prev => [
            { command, result, timestamp: new Date().toISOString() },
            ...prev.slice(0, 9), // Keep last 10
        ]);

        // Refresh KPIs
        setAgentKPIs(agent.getKPIs());
    };

    const commandsByCategory = selectedCategory
        ? { [selectedCategory]: AGENCYOS_COMMANDS[selectedCategory] }
        : AGENCYOS_COMMANDS;

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-8">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-12">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <Command className="w-10 h-10 text-cyan-400" />
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                                AgencyOS Integration
                            </h1>
                        </div>
                        <p className="text-gray-400 text-lg">
                            85+ AI-powered automation commands for WellNexus HealthFi OS
                        </p>
                    </div>
                    <button
                        onClick={() => setIsPaletteOpen(true)}
                        className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                    >
                        Open Command Palette ⌘K
                    </button>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Sidebar - Categories */}
                <div className="lg:col-span-1">
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-yellow-400" />
                            Command Categories
                        </h2>
                        <div className="space-y-2">
                            {(Object.keys(AGENCYOS_COMMANDS) as AgencyOSCategory[]).map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                                    className={`w-full p-4 rounded-lg text-left transition-all ${selectedCategory === cat
                                            ? `bg-gradient-to-r ${CATEGORY_COLORS[cat]} text-white`
                                            : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{CATEGORY_ICONS[cat]}</span>
                                            <div>
                                                <div className="font-medium capitalize">{cat}</div>
                                                <div className="text-xs opacity-75">
                                                    {AGENCYOS_COMMANDS[cat].length} commands
                                                </div>
                                            </div>
                                        </div>
                                        <CheckCircle
                                            className={`w-5 h-5 ${selectedCategory === cat ? 'opacity-100' : 'opacity-0'
                                                }`}
                                        />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Agent KPIs */}
                        {agentKPIs && (
                            <div className="mt-6 pt-6 border-t border-gray-700">
                                <h3 className="text-sm font-semibold mb-3 text-gray-400">Agent KPIs</h3>
                                <div className="space-y-2">
                                    {agentKPIs.map((kpi: any, idx: number) => (
                                        <div key={idx} className="bg-gray-700/30 rounded p-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-400">{kpi.name}</span>
                                                <span className="font-mono text-cyan-400">
                                                    {kpi.current?.toLocaleString() || 0} {kpi.unit}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-600 rounded-full h-1.5 mt-1">
                                                <div
                                                    className="bg-cyan-500 h-1.5 rounded-full transition-all"
                                                    style={{
                                                        width: `${Math.min(((kpi.current || 0) / kpi.target) * 100, 100)}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content - Command Showcase */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Command Grid */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-bold mb-4">
                            {selectedCategory
                                ? `${CATEGORY_ICONS[selectedCategory]} ${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Commands`
                                : '🚀 All Commands'}
                        </h2>
                        <div className="grid grid-cols-1 gap-3">
                            {Object.entries(commandsByCategory).map(([cat, commands]) =>
                                commands.map((cmd) => (
                                    <button
                                        key={cmd.command}
                                        onClick={() => runDemoCommand(cmd.command)}
                                        className="p-4 bg-gray-700/30 hover:bg-gray-700/50 rounded-lg text-left transition-all group border border-transparent hover:border-cyan-500/50"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-lg">{CATEGORY_ICONS[cat as AgencyOSCategory]}</span>
                                                    <code className="text-cyan-400 font-mono text-sm font-medium">
                                                        {cmd.command}
                                                    </code>
                                                    <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                                                        {cat}
                                                    </span>
                                                </div>
                                                <p className="text-gray-400 text-sm">{cmd.description}</p>
                                            </div>
                                            <Zap className="w-4 h-4 text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Execution Log */}
                    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-purple-400" />
                            Execution History
                        </h2>
                        {executionLog.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                <Command className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No commands executed yet. Click a command above to try!</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {executionLog.map((log, idx) => (
                                    <div
                                        key={idx}
                                        className="bg-gray-700/30 rounded-lg p-4 border border-gray-600"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <code className="text-cyan-400 font-mono text-sm">{log.command}</code>
                                            <span className="text-xs text-gray-500">
                                                {new Date(log.timestamp).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        {log.result.success ? (
                                            <div className="text-green-400 text-sm">
                                                <p className="font-medium">✅ {log.result.message}</p>
                                                <p className="text-gray-400 mt-1">{log.result.output}</p>
                                            </div>
                                        ) : (
                                            <div className="text-red-400 text-sm">
                                                ❌ {log.result.error}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Command Palette */}
            <CommandPalette isOpen={isPaletteOpen} onClose={() => setIsPaletteOpen(false)} />
        </div>
    );
}

export default AgencyOSDemo;
