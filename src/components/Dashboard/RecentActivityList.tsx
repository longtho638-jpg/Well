import React from 'react';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Activity {
    icon: React.ElementType;
    label: string;
    time: string;
    color: string;
    bg: string;
}

interface RecentActivityListProps {
    activities: Activity[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-950/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8 group relative overflow-hidden"
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-[3.5s] text-blue-500">
                <Clock size={150} />
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-xl">
                    <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">
                    {t('dashboard.recentActivity.title')}
                </h3>
            </div>

            <div className="space-y-4">
                {activities.map((activity, idx) => (
                    <motion.div
                        key={idx}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        whileHover={{ x: 5 }}
                        className="flex items-start gap-5 p-4 rounded-[1.5rem] bg-zinc-900/50 border border-white/5 hover:border-white/10 transition-all cursor-crosshair group/row"
                    >
                        <div className={`w-10 h-10 ${activity.bg} rounded-xl flex items-center justify-center shrink-0 border border-white/5 shadow-inner group-hover/row:scale-110 transition-transform`}>
                            <activity.icon className={`w-5 h-5 ${activity.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-white uppercase italic tracking-tight mb-1 truncate">
                                {activity.label}
                            </p>
                            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                                <span className="w-1 h-1 rounded-full bg-blue-500" />
                                {activity.time}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-4 bg-zinc-900 text-zinc-500 font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl border border-white/5 hover:text-white hover:border-white/10 transition-all italic"
            >
                {t('recentactivitylist.view_digital_audit_trace')}</motion.button>
        </motion.div>
    );
};
