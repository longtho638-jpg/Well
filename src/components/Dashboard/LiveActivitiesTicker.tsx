import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, Clock, Sparkles } from 'lucide-react';
import { LiveActivity } from '@/hooks/useDashboard';
import { useTranslation } from '@/hooks';

interface LiveActivitiesTickerProps {
    activities: LiveActivity[];
}

export const LiveActivitiesTicker: React.FC<LiveActivitiesTickerProps> = ({ activities }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-950 border border-white/5 rounded-3xl shadow-2xl overflow-hidden group"
        >
            <div className="bg-zinc-900/50 border-b border-white/5 px-8 py-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500 rounded-xl blur-md opacity-20 animate-pulse" />
                        <div className="relative w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Radio className="w-6 h-6 text-white" />
                        </div>
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 italic">
                            {t('dashboard.liveActivities.title')}
                            <span className="flex items-center gap-1.5 text-[10px] bg-red-500/10 text-red-500 px-2.5 py-1 rounded-full border border-red-500/20">
                                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                                {t('dashboard.liveActivities.live')}
                            </span>
                        </h3>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                            {t('dashboard.liveActivities.subtitle')}
                        </p>
                    </div>
                </div>
            </div>

            <div className="h-[420px] relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-10 bg-gradient-to-b from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-zinc-950 to-transparent z-10 pointer-events-none" />

                <div className="h-full overflow-y-auto px-6 py-6 space-y-3 scrollbar-hide">
                    <AnimatePresence mode="popLayout">
                        {activities.map((activity, index) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, x: -20, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 20, scale: 0.95 }}
                                transition={{ duration: 0.4, ease: "circOut" }}
                                layout
                            >
                                <div className={`
                                    flex items-start gap-4 p-4 rounded-2xl border transition-all duration-500
                                    ${index === 0
                                        ? 'bg-zinc-900 border-white/10 ring-1 ring-white/5 shadow-xl'
                                        : 'bg-zinc-950 border-white/5 hover:border-white/10'}
                                `}>
                                    <div className={`w-10 h-10 ${activity.bgColor} rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner`}>
                                        <activity.icon className={`w-5 h-5 ${activity.color}`} />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-black text-white uppercase italic tracking-tight truncate">
                                                {activity.userName}
                                            </p>
                                            <div className="flex items-center gap-1.5 text-[10px] text-zinc-500 font-bold">
                                                <Clock className="w-3 h-3" />
                                                {activity.timestamp.toLocaleTimeString('vi-VN', {
                                                    hour: '2-digit', minute: '2-digit'
                                                })}
                                            </div>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                                            {activity.message}
                                        </p>
                                    </div>

                                    {index === 0 && (
                                        <motion.div
                                            initial={{ rotate: 0, scale: 0 }}
                                            animate={{ rotate: 360, scale: 1 }}
                                            className="text-amber-500"
                                        >
                                            <Sparkles size={14} />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="bg-zinc-900/30 border-t border-white/5 px-8 py-3 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                <span className="text-zinc-500">
                    <span className="text-teal-500">🔥</span> RECENT: {activities.length} NODES
                </span>
                <span className="text-zinc-600 italic">
                    {t('dashboard.liveActivities.systemActive')}
                </span>
            </div>
        </motion.div>
    );
};
