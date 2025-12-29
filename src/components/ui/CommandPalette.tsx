import React, { useState, useMemo, useCallback } from 'react';
import { Search, Command, ChevronRight, X, Loader2, AlertCircle } from 'lucide-react';
import { AGENCYOS_COMMANDS, AgencyOSCategory } from '@/agents/custom/AgencyOSAgent';
import { agentRegistry } from '@/agents';
import { commandRateLimiter } from '@/lib/rate-limiter';
import analytics from '@/lib/analytics';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORY_ICONS: Record<AgencyOSCategory, string> = {
    marketing: '📣',
    sales: '💼',
    finance: '💰',
    operations: '⚙️',
    strategy: '🎯',
    agents: '🤖',
};

const CATEGORY_LABELS: Record<AgencyOSCategory, string> = {
    marketing: 'Marketing',
    sales: 'Sales',
    finance: 'Finance',
    operations: 'Operations',
    strategy: 'Strategy (Binh Pháp)',
    agents: 'AI Agents',
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<AgencyOSCategory | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);

    // Filter commands based on search and category
    const filteredCommands = useMemo(() => {
        const results: Array<{ category: AgencyOSCategory; command: string; description: string }> = [];
        const lowerSearch = search.toLowerCase();

        const categories = selectedCategory
            ? [selectedCategory]
            : (Object.keys(AGENCYOS_COMMANDS) as AgencyOSCategory[]);

        for (const cat of categories) {
            for (const cmd of AGENCYOS_COMMANDS[cat]) {
                if (
                    !search ||
                    cmd.command.toLowerCase().includes(lowerSearch) ||
                    cmd.description.toLowerCase().includes(lowerSearch)
                ) {
                    results.push({ category: cat, ...cmd });
                }
            }
        }

        return results;
    }, [search, selectedCategory]);

    // Execute a command via AgencyOSAgent
    const executeCommand = useCallback(async (command: string) => {
        // Check rate limit
        const userId = 'user'; // In production, use actual user ID
        if (!commandRateLimiter.isAllowed(userId, command)) {
            const resetTime = Math.ceil(commandRateLimiter.getResetTime(userId) / 1000);
            setLastResult({
                success: false,
                error: `Rate limit exceeded. Please wait ${resetTime}s before executing more commands.`,
            });
            analytics.event('rate_limit_exceeded', { command });
            return;
        }

        setIsExecuting(true);
        setLastResult(null);
        const startTime = Date.now();

        try {
            const agent = agentRegistry.get('AgencyOS');
            if (!agent) {
                throw new Error('AgencyOS agent not found in registry');
            }

            const result = await agent.execute({
                action: 'executeCommand',
                command,
            });

            const executionTime = Date.now() - startTime;

            // Track successful command execution
            analytics.trackCommand(command, result.success, executionTime);

            setLastResult(result);
        } catch (error) {
            const executionTime = Date.now() - startTime;

            const errorResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };

            // Track error
            analytics.trackCommand(command, false, executionTime);
            if (error instanceof Error) {
                analytics.trackError(error, { command });
            }

            setLastResult(errorResult);
        } finally {
            setIsExecuting(false);
        }
    }, []);

    // Handle keyboard shortcuts
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
            onKeyDown={handleKeyDown}
        >
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Palette Container */}
            <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
                {/* Header/Search */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
                    <Command className="w-5 h-5 text-cyan-400" />
                    <input
                        type="text"
                        placeholder="Type a command or search..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                        autoFocus
                    />
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-800 rounded transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Category Tabs */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 overflow-x-auto">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${!selectedCategory
                            ? 'bg-cyan-500/20 text-cyan-400'
                            : 'text-gray-400 hover:bg-gray-800'
                            }`}
                    >
                        All
                    </button>
                    {(Object.keys(AGENCYOS_COMMANDS) as AgencyOSCategory[]).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${selectedCategory === cat
                                ? 'bg-cyan-500/20 text-cyan-400'
                                : 'text-gray-400 hover:bg-gray-800'
                                }`}
                        >
                            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>

                {/* Command List */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>No commands found</p>
                        </div>
                    ) : (
                        <ul className="py-2">
                            {filteredCommands.map((cmd) => (
                                <li key={cmd.command}>
                                    <button
                                        onClick={() => executeCommand(cmd.command)}
                                        disabled={isExecuting}
                                        className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-gray-800/50 transition-colors text-left group"
                                    >
                                        <span className="text-lg">{CATEGORY_ICONS[cmd.category]}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <code className="text-cyan-400 font-mono text-sm">
                                                    {cmd.command}
                                                </code>
                                                <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                                                    {CATEGORY_LABELS[cmd.category]}
                                                </span>
                                            </div>
                                            <p className="text-gray-400 text-sm truncate">
                                                {cmd.description}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-cyan-400 transition-colors" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Result Display */}
                {(isExecuting || lastResult) && (
                    <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
                        {isExecuting ? (
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Executing command...</span>
                            </div>
                        ) : lastResult?.success ? (
                            <div className="text-green-400">
                                <p className="font-medium">{lastResult.message}</p>
                                <p className="text-sm text-gray-400 mt-1">{lastResult.output}</p>
                            </div>
                        ) : (
                            <div className="text-red-400">
                                <p className="font-medium">❌ Error</p>
                                <p className="text-sm">{lastResult?.error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/30 flex items-center justify-between text-xs text-gray-500">
                    <span>🏯 AgencyOS • 85+ Commands</span>
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">⌘</kbd> +
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded ml-1">K</kbd> to open
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
