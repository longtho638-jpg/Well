import React from 'react';
import { motion } from 'framer-motion';
import { Bot, Sparkles, MessageSquare, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface CopilotHeaderProps {
    productContext?: string;
    isLoading: boolean;
    messageCount: number;
    onGenerateScript: () => void;
    onGetCoaching: () => void;
}

export const CopilotHeader: React.FC<CopilotHeaderProps> = React.memo(({
    productContext,
    isLoading,
    messageCount,
    onGenerateScript,
    onGetCoaching
}) => {
    const { t } = useTranslation();
    return (
        <div className="relative overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-900 via-zinc-900 to-black" />
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzEwYjk4MSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-20" />

            {/* Content */}
            <div className="relative p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {/* AI Avatar with Breathing Animation */}
                    <div className="relative">
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                boxShadow: [
                                    '0 0 20px rgba(52, 211, 153, 0.3)',
                                    '0 0 30px rgba(52, 211, 153, 0.5)',
                                    '0 0 20px rgba(52, 211, 153, 0.3)',
                                ]
                            }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            className="w-12 h-12 bg-white dark:bg-zinc-800 rounded-2xl flex items-center justify-center shadow-lg border border-zinc-200 dark:border-zinc-700"
                        >
                            <Bot className="w-7 h-7 text-emerald-400" />
                        </motion.div>
                        <motion.div
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            className="absolute inset-0 bg-emerald-500/20 rounded-2xl blur-md -z-10"
                        />
                    </div>

                    <div>
                        <h3 className="font-bold text-zinc-900 dark:text-white flex items-center gap-2 text-lg">
                            {t('copilotheader.the_copilot')}<motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
                            >
                                <Sparkles className="w-4 h-4 text-emerald-400" />
                            </motion.div>
                        </h3>
                        <p className="text-xs text-zinc-400">{t('copilotheader.ai_sales_assistant_powered_b')}</p>
                    </div>
                </div>

                <div className="flex gap-2">
                    {productContext && (
                        <button
                            onClick={onGenerateScript}
                            disabled={isLoading}
                            className="px-3 py-2 bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 disabled:opacity-50"
                            title="Generate sales script"
                        >
                            <MessageSquare className="w-3.5 h-3.5" />
                            {t('copilotheader.script')}</button>
                    )}
                    <button
                        onClick={onGetCoaching}
                        disabled={isLoading || messageCount < 3}
                        className="px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-zinc-700 hover:border-zinc-600 disabled:opacity-50"
                        title="Get coaching tips"
                    >
                        <TrendingUp className="w-3.5 h-3.5" />
                        {t('copilotheader.coach')}</button>
                </div>
            </div>
        </div>
    );
});

CopilotHeader.displayName = 'CopilotHeader';
