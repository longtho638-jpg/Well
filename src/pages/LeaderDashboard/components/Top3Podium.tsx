/**
 * Top 3 Podium Component
 * Displays top 3 performers with podium-style layout
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Award, Crown, Star } from 'lucide-react';
import { TeamMember } from '@/types';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface Top3PodiumProps {
    performers: TeamMember[];
}

export function Top3Podium({ performers }: Top3PodiumProps) {
    const { t } = useTranslation();
    if (performers.length < 3) return null;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="relative"
        >
            {/* Glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-red-500/20 rounded-3xl blur-2xl" />

            {/* Card */}
            <div className="relative bg-white/80 dark:bg-zinc-900/50 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-3xl p-8">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/20 rounded-xl">
                                <Award className="w-6 h-6 text-yellow-400" />
                            </div>
                            {t('leaderdashboard.top_3_t_ng_t_i')}</h2>
                        <p className="text-zinc-400 text-sm mt-1">{t('leaderdashboard.doanh_s_cao_nh_t_th_ng_n_y')}</p>
                    </div>
                </div>

                {/* Podium */}
                <div className="grid grid-cols-3 gap-6 items-end">
                    {/* 2nd Place */}
                    <PodiumPlace performer={performers[1]} place={2} />

                    {/* 1st Place */}
                    <PodiumPlace performer={performers[0]} place={1} />

                    {/* 3rd Place */}
                    <PodiumPlace performer={performers[2]} place={3} />
                </div>
            </div>
        </motion.div>
    );
}

interface PodiumPlaceProps {
    performer: TeamMember;
    place: 1 | 2 | 3;
}

function PodiumPlace({ performer, place }: PodiumPlaceProps) {
    const { t } = useTranslation();
    const config = {
        1: {
            delay: 0.2,
            scale: 'transform scale-110',
            gradient: 'from-yellow-400 to-orange-600',
            border: 'border-yellow-400',
            ring: 'ring-yellow-400/30',
            size: 'w-32 h-32',
            badgeSize: 'w-12 h-12',
            glow: 'blur-2xl opacity-70 animate-pulse',
        },
        2: {
            delay: 0.3,
            scale: '',
            gradient: 'from-gray-400 to-gray-600',
            border: 'border-gray-400',
            ring: '',
            size: 'w-24 h-24',
            badgeSize: 'w-10 h-10',
            glow: 'blur-xl opacity-50',
        },
        3: {
            delay: 0.4,
            scale: '',
            gradient: 'from-orange-400 to-orange-600',
            border: 'border-orange-400',
            ring: '',
            size: 'w-24 h-24',
            badgeSize: 'w-10 h-10',
            glow: 'blur-xl opacity-50',
        },
    }[place];

    return (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: config.delay }}
            className={`text-center ${config.scale}`}
        >
            <div className="relative mb-4 inline-block">
                <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient} rounded-full ${config.glow}`} />
                <img
                    src={performer.avatarUrl}
                    alt={performer.name}
                    className={`relative ${config.size} rounded-full border-4 ${config.border} shadow-2xl mx-auto ${config.ring ? `ring-4 ${config.ring}` : ''}`}
                />
                {place === 1 && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <Crown className="w-10 h-10 text-yellow-400 drop-shadow-2xl animate-pulse" fill="currentColor" />
                    </div>
                )}
                <div className={`absolute ${place === 1 ? '-bottom-2 left-1/2 -translate-x-1/2' : '-top-2 -right-2'} ${config.badgeSize} bg-gradient-to-br ${config.gradient} rounded-full flex items-center justify-center border-${place === 1 ? '4' : '2'} border-white shadow-${place === 1 ? '2xl' : 'lg'}`}>
                    <span className={`text-white font-bold text-${place === 1 ? 'xl' : 'lg'}`}>{place}</span>
                </div>
            </div>
            <h3 className={`text-white font-bold text-${place === 1 ? 'xl' : 'lg'} mb-1`}>{performer.name}</h3>
            <p className={`${place === 1 ? 'text-yellow-400 flex items-center justify-center gap-1' : 'text-zinc-400'} text-sm mb-2`}>
                {place === 1 && <Star className="w-4 h-4" fill="currentColor" />}
                {performer.rank}
            </p>
            <div className={`${place === 1 ? 'bg-yellow-500/10 border-yellow-500/20 p-4' : 'bg-zinc-100 dark:bg-zinc-800/50 border-zinc-300 dark:border-zinc-700 p-3'} backdrop-blur-sm rounded-xl border`}>
                <p className={`${place === 1 ? 'text-yellow-200' : 'text-zinc-400'} text-xs mb-1`}>{t('leaderdashboard.doanh_s')}</p>
                <p className={`text-white font-bold ${place === 1 ? 'text-lg' : ''}`}>{formatVND(performer.personalSales)}</p>
            </div>
        </motion.div>
    );
}
