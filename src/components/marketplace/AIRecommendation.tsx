import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Bot, TrendingUp } from 'lucide-react';

interface AIRecommendationProps {
    suggestion: { text: string; productIds: string[] } | null;
    loading: boolean;
    title: string;
    liveLabel: string;
    loadingText: string;
}

export const AIRecommendation: React.FC<AIRecommendationProps> = ({
    suggestion,
    loading,
    title,
    liveLabel,
    loadingText,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-[2.5rem] mb-10 border border-indigo-500/20 shadow-2xl shadow-indigo-950/40"
        >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-purple-950 to-zinc-950" />
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />

            {/* Animated Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[radial-gradient(circle,rgba(99,102,241,0.15)_0%,transparent_70%)] animate-pulse" />

            <div className="relative p-8 md:p-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="shrink-0">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-2xl rounded-2xl flex items-center justify-center text-amber-400 border border-white/20 shadow-inner">
                        {loading ? <Sparkles className="w-8 h-8 animate-spin" /> : <Bot className="w-8 h-8" />}
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                        <h3 className="text-2xl font-black text-white tracking-tight">{title}</h3>
                        <span className="bg-amber-400 text-indigo-950 text-[10px] font-black px-3 py-1 rounded-full uppercase flex items-center gap-1.5 shadow-lg shadow-amber-500/20">
                            <TrendingUp className="w-3.5 h-3.5" /> {liveLabel}
                        </span>
                    </div>

                    <div className="min-h-[3rem]">
                        <AnimatePresence mode="wait">
                            {loading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center justify-center md:justify-start gap-2"
                                >
                                    <div className="flex gap-1">
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" />
                                    </div>
                                    <p className="text-indigo-200/60 font-medium italic text-sm">{loadingText}</p>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="content"
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className="text-lg md:text-xl text-indigo-50/90 leading-relaxed font-medium"
                                >
                                    {suggestion?.text.split('**').map((part, i) =>
                                        i % 2 === 1 ? (
                                            <span key={i} className="text-amber-400 font-black drop-shadow-[0_0_8px_rgba(251,191,36,0.4)]">
                                                {part}
                                            </span>
                                        ) : part
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                <div className="hidden lg:block shrink-0">
                    <div className="px-6 py-4 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                        <div className="text-3xl font-black text-white">240+</div>
                        <div className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">Users Helped</div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
