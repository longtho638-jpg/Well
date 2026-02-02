import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, ShoppingBag, UserPlus, Star, Trophy, Activity, TrendingDown, type LucideIcon } from 'lucide-react';
import { useTranslation } from '@/hooks';

// Types - Unified with useDashboard.ts
export type ActivityType = 'reward' | 'order' | 'rank_up' | 'withdrawal' | 'referral';

export interface LiveActivity {
    id: string;
    type: ActivityType;
    user?: string;
    userName?: string; // Support both
    detail?: string;
    message?: string; // Support both
    amount?: number;
    timestamp: Date;
    location?: string;
    bgColor?: string;
    color?: string;
    icon?: LucideIcon;
}

interface LiveActivitiesTickerProps {
    activities: LiveActivity[];
}

const getActivityIcon = (type: ActivityType) => {
    switch (type) {
        case 'order': return <ShoppingBag size={14} className="text-emerald-400" />;
        case 'referral': return <UserPlus size={14} className="text-blue-400" />;
        case 'rank_up': return <Trophy size={14} className="text-yellow-400" />;
        case 'reward': return <Star size={14} className="text-purple-400" />;
        case 'withdrawal': return <TrendingDown size={14} className="text-red-400" />;
        default: return <Activity size={14} className="text-zinc-400" />;
    }
};

export const LiveActivitiesTicker: React.FC<LiveActivitiesTickerProps> = ({ activities }) => {
    const { t } = useTranslation();

    return (
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-6 h-full flex flex-col shadow-xl overflow-hidden relative group">
            {/* Ambient Background Effect */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                        <Zap size={16} className="text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{t('dashboard.liveActivities')}</h3>
                        <div className="flex items-center gap-2 text-[10px] font-medium text-zinc-500 uppercase tracking-wider">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            {t('dashboard.liveActivities.live')}
                        </div>
                    </div>
                </div>
                <div className="text-xs font-mono text-zinc-600 bg-zinc-950 px-2 py-1 rounded border border-white/5">
                    {t('dashboard.liveActivities.subtitle')}
                </div>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-zinc-900 to-transparent z-10 pointer-events-none" />
                
                <div className="space-y-3">
                    <AnimatePresence initial={false}>
                        {activities.map((activity) => (
                            <motion.div
                                key={activity.id}
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: 'auto' }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3 hover:bg-white/10 transition-colors cursor-default"
                            >
                                <div className={`p-2 rounded-full bg-zinc-900 border border-white/10 shrink-0`}>
                                    {getActivityIcon(activity.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-0.5">
                                        <p className="text-xs font-bold text-white truncate">
                                            {activity.userName || activity.user} <span className="text-zinc-500 font-normal ml-1">in {activity.location || 'Vietnam'}</span>
                                        </p>
                                        <span className="text-[10px] text-zinc-500 font-mono">Just now</span>
                                    </div>
                                    <p className="text-[11px] text-zinc-400 truncate">{activity.message || activity.detail}</p>
                                </div>
                                {activity.amount && activity.amount > 0 && (
                                    <div className="text-right shrink-0">
                                        <div className="text-xs font-bold text-emerald-400">+{activity.amount.toLocaleString()}</div>
                                        <div className="text-[9px] text-zinc-600 uppercase">VND</div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                <span><span className="text-teal-500">🔥</span> {t('liveactivitiesticker.recent')}{activities.length} {t('liveactivitiesticker.nodes')}</span>
                <span className="flex items-center gap-1">
                    {t('dashboard.liveActivities.systemActive')}
                </span>
            </div>
        </div>
    );
};
