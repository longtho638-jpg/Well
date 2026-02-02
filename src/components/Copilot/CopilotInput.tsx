import React from 'react';
import { Send } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface CopilotInputProps {
    input: string;
    setInput: (val: string) => void;
    isLoading: boolean;
    onSend: () => void;
}

export const CopilotInput: React.FC<CopilotInputProps> = ({
    input,
    setInput,
    isLoading,
    onSend
}) => {
    const { t } = useTranslation();
    return (
        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && onSend()}
                    placeholder={t('copilot.input.placeholder')}
                    className="flex-1 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 text-sm text-zinc-900 dark:text-white placeholder-zinc-500 transition-all"
                    disabled={isLoading}
                />
                <button
                    onClick={onSend}
                    disabled={isLoading || !input.trim()}
                    className="px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/30 font-bold"
                >
                    <Send className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
