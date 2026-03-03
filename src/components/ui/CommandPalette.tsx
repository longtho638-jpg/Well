import React from 'react';
import { Search, Command, ChevronRight, X, Loader2, Megaphone, Briefcase, DollarSign, Settings, Target, Bot } from 'lucide-react';
import { AGENCYOS_COMMANDS, AgencyOSCategory } from '@/agents/custom/AgencyOSAgent';
import { useTranslation } from '@/hooks';
import { useCommandPaletteSearchAndExecution } from './use-command-palette-search-and-execution';

interface CommandPaletteProps {
    isOpen: boolean;
    onClose: () => void;
}

const CATEGORY_ICONS: Record<AgencyOSCategory, React.ReactNode> = {
    marketing: <Megaphone className="w-4 h-4" />,
    sales: <Briefcase className="w-4 h-4" />,
    finance: <DollarSign className="w-4 h-4" />,
    operations: <Settings className="w-4 h-4" />,
    strategy: <Target className="w-4 h-4" />,
    agents: <Bot className="w-4 h-4" />,
};

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
    const { t } = useTranslation();

    const CATEGORY_LABELS: Record<AgencyOSCategory, string> = {
        marketing: t('agencyos.categories.marketing'),
        sales: t('agencyos.categories.sales'),
        finance: t('agencyos.categories.finance'),
        operations: t('agencyos.categories.operations'),
        strategy: t('agencyos.categories.strategy'),
        agents: t('agencyos.categories.agents'),
    };

    const {
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
    } = useCommandPaletteSearchAndExecution(isOpen, onClose);

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh]"
            onKeyDown={handleKeyDown}
            role="none"
        >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} role="presentation" />

            <div className="relative w-full max-w-2xl bg-gray-900 rounded-xl shadow-2xl border border-gray-700 overflow-hidden" role="dialog" aria-modal="true">
                {/* Search header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
                    <Command className="w-5 h-5 text-cyan-400" />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={t('common.search')}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-lg"
                    />
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded transition-colors cursor-pointer">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Category tabs */}
                <div className="flex items-center gap-1 px-4 py-2 border-b border-gray-800 overflow-x-auto">
                    <button
                        onClick={() => setSelectedCategory(null)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${!selectedCategory ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-800'}`}
                    >
                        {t('commandpalette.all')}
                    </button>
                    {(Object.keys(AGENCYOS_COMMANDS) as AgencyOSCategory[]).map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${selectedCategory === cat ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-400 hover:bg-gray-800'}`}
                        >
                            {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                        </button>
                    ))}
                </div>

                {/* Command list */}
                <div className="max-h-[50vh] overflow-y-auto">
                    {filteredCommands.length === 0 ? (
                        <div className="px-4 py-8 text-center text-gray-500">
                            <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>{t('commandpalette.no_commands_found')}</p>
                        </div>
                    ) : (
                        <ul ref={listRef} className="py-2" role="listbox" aria-label={t('commandpalette.command_list')}>
                            {filteredCommands.map((cmd, index) => (
                                <li key={cmd.command} role="option" aria-selected={selectedIndex === index}>
                                    <button
                                        onClick={() => executeCommand(cmd.command)}
                                        disabled={isExecuting}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left group cursor-pointer ${
                                            selectedIndex === index ? 'bg-gray-800/80 ring-1 ring-inset ring-cyan-500/50' : 'hover:bg-gray-800/50'
                                        }`}
                                    >
                                        <span className="text-lg">{CATEGORY_ICONS[cmd.category]}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <code className={`text-sm font-mono transition-colors ${selectedIndex === index ? 'text-cyan-300' : 'text-cyan-400'}`}>
                                                    {cmd.command}
                                                </code>
                                                <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                                                    {CATEGORY_LABELS[cmd.category]}
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate transition-colors ${selectedIndex === index ? 'text-gray-300' : 'text-gray-400'}`}>
                                                {t(cmd.i18nKey)}
                                            </p>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-colors ${selectedIndex === index ? 'text-cyan-300 translate-x-1' : 'text-gray-600 group-hover:text-cyan-400'}`} />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* Result display */}
                {(isExecuting || lastResult) && (
                    <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
                        {isExecuting ? (
                            <div className="flex items-center gap-2 text-cyan-400">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t('commandpalette.executing_command')}</span>
                            </div>
                        ) : lastResult?.success ? (
                            <div className="text-green-400">
                                <p className="font-medium">{lastResult.message}</p>
                                <p className="text-sm text-gray-400 mt-1">{lastResult.output}</p>
                            </div>
                        ) : (
                            <div className="text-red-400">
                                <p className="font-medium">{t('commandpalette.error')}</p>
                                <p className="text-sm">{lastResult?.error}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-700 bg-gray-800/30 flex items-center justify-between text-xs text-gray-500">
                    <span>{t('commandpalette.agencyos_85_commands')}</span>
                    <span>
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded">⌘</kbd> +
                        <kbd className="px-1.5 py-0.5 bg-gray-700 rounded ml-1">K</kbd> {t('commandpalette.to_open')}
                    </span>
                </div>
            </div>
        </div>
    );
}

export default CommandPalette;
