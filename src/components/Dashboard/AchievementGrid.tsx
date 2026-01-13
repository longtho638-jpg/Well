import React from 'react';
import { motion } from 'framer-motion';
import { Award, ShieldAlert } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Achievement {
    icon: React.ElementType;
    label: string;
    unlocked: boolean;
    color: string;
}

interface AchievementGridProps {
    achievements: Achievement[];
}

export const AchievementGrid: React.FC<AchievementGridProps> = ({ achievements }) => {
    const { t } = useTranslation();

    const unlockedCount = achievements.filter(a => a.unlocked).length;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-950 border border-white/5 rounded-[2.5rem] shadow-2xl p-8 group relative overflow-hidden"
        >
            {/* Background Aesthetic */}
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent animate-pulse" />
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform duration-[4s] text-purple-500">
                <Award size={180} />
            </div>

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center border border-purple-500/20 shadow-xl">
                            <Award className="w-6 h-6 text-purple-400" />
                        </div>
                        <h3 className="text-sm font-black text-white uppercase tracking-widest italic">
                            {t('dashboard.achievements.title')}
                        </h3>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">
                            Ecosystem Standing
                        </p>
                        <div className="text-xl font-black text-white italic tracking-tighter">
                            {unlockedCount} / {achievements.length}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    {achievements.map((badge, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3 + idx * 0.1 }}
                            whileHover={{ y: -5 }}
                            className={`
                                relative p-6 rounded-[2rem] text-center border overflow-hidden group/badge
                                ${badge.unlocked
                                    ? 'bg-zinc-900 border-white/10 shadow-xl'
                                    : 'bg-zinc-950 border-white/5 opacity-40'
                                }
                            `}
                        >
                            {badge.unlocked && (
                                <div className={`absolute inset-0 bg-gradient-to-br ${badge.color} opacity-[0.03] group-hover/badge:opacity-[0.08] transition-opacity`} />
                            )}

                            <div className="relative z-10">
                                <badge.icon className={`w-10 h-10 mx-auto mb-3 transition-transform duration-500 ${badge.unlocked ? 'text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] group-hover/badge:scale-110' : 'text-zinc-700'}`} />
                                <p className={`text-[10px] font-black uppercase tracking-widest italic ${badge.unlocked ? 'text-white' : 'text-zinc-600'}`}>
                                    {badge.label}
                                </p>
                            </div>

                            {!badge.unlocked && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                    <div className="w-10 h-10 bg-zinc-900/80 rounded-full flex items-center justify-center border border-white/5 shadow-2xl">
                                        <ShieldAlert size={16} className="text-zinc-600" />
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>

                <div className="mt-8">
                    <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(unlockedCount / achievements.length) * 100}%` }}
                            transition={{ delay: 0.8, duration: 1.5, ease: "circOut" }}
                            className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                        />
                    </div>
                </div>
            </div>
        </motion.div>
    );
};
