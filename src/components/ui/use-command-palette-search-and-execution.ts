import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { AGENCYOS_COMMANDS, AgencyOSCategory } from '@/agents/custom/AgencyOSAgent';
import { agentRegistry } from '@/agents';
import { commandRateLimiter } from '@/lib/rate-limiter';
import analytics from '@/lib/analytics';

export type CommandResult = { success: boolean; message?: string; output?: string; error?: string };

export function useCommandPaletteSearchAndExecution(isOpen: boolean, onClose: () => void) {
    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<AgencyOSCategory | null>(null);
    const [isExecuting, setIsExecuting] = useState(false);
    const [lastResult, setLastResult] = useState<CommandResult | null>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const filteredCommands = useMemo(() => {
        const results: Array<{ category: AgencyOSCategory; command: string; description: string; i18nKey: string }> = [];
        const lowerSearch = search.toLowerCase();
        const categories = selectedCategory
            ? [selectedCategory]
            : (Object.keys(AGENCYOS_COMMANDS) as AgencyOSCategory[]);

        for (const cat of categories) {
            for (const cmd of AGENCYOS_COMMANDS[cat]) {
                if (!search || cmd.command.toLowerCase().includes(lowerSearch) || cmd.description.toLowerCase().includes(lowerSearch)) {
                    results.push({ category: cat, ...cmd });
                }
            }
        }
        return results;
    }, [search, selectedCategory]);

    // Reset selected index when filtered results change
    useEffect(() => { setSelectedIndex(0); }, [filteredCommands]);

    // Focus input on open
    useEffect(() => {
        if (!isOpen) return;
        const timer = setTimeout(() => { inputRef.current?.focus(); }, 100);
        return () => clearTimeout(timer);
    }, [isOpen]);

    const executeCommand = useCallback(async (command: string) => {
        const userId = 'user';
        if (!commandRateLimiter.isAllowed(userId, command)) {
            const resetTime = Math.ceil(commandRateLimiter.getResetTime(userId) / 1000);
            setLastResult({ success: false, error: `Rate limit exceeded. Please wait ${resetTime}s before executing more commands.` });
            analytics.event('rate_limit_exceeded', { command });
            return;
        }

        setIsExecuting(true);
        setLastResult(null);
        const startTime = Date.now();

        try {
            const agent = agentRegistry.get('AgencyOS');
            if (!agent) throw new Error('AgencyOS agent not found in registry');

            const result = await agent.execute({ action: 'executeCommand', command }) as CommandResult;
            analytics.trackCommand(command, result.success, Date.now() - startTime);
            setLastResult(result);
        } catch (error) {
            const executionTime = Date.now() - startTime;
            const errorResult = { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
            analytics.trackCommand(command, false, executionTime);
            if (error instanceof Error) analytics.trackError(error, { command });
            setLastResult(errorResult);
        } finally {
            setIsExecuting(false);
        }
    }, []);

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
        } else if (e.key === 'Enter' && filteredCommands.length > 0) {
            e.preventDefault();
            executeCommand(filteredCommands[selectedIndex].command);
        }
    }, [onClose, filteredCommands, selectedIndex, executeCommand]);

    return {
        search, setSearch,
        selectedCategory, setSelectedCategory,
        isExecuting,
        lastResult,
        selectedIndex,
        filteredCommands,
        inputRef,
        listRef,
        executeCommand,
        handleKeyDown,
    };
}
