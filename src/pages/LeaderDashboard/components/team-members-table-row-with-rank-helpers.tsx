/**
 * TeamMembersTable sub-component: animated table row with rank badge and action buttons.
 * Also exports getRankBadgeColor and getGrowthColor helpers.
 * Extracted from TeamMembersTable.tsx to keep parent under 200 LOC.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MoreVertical } from 'lucide-react';
import { TeamMember, UserRank, RANK_NAMES } from '@/types';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

export const getRankBadgeColor = (rank: UserRank): string => {
    switch (rank) {
        case UserRank.THIEN_LONG:
        case UserRank.PHUONG_HOANG:
            return 'bg-purple-100 text-purple-700';
        case UserRank.DAI_SU_DIAMOND:
        case UserRank.DAI_SU_GOLD:
        case UserRank.DAI_SU_SILVER:
        case UserRank.DAI_SU:
            return 'bg-blue-100 text-blue-700';
        case UserRank.KHOI_NGHIEP:
            return 'bg-green-100 text-green-700';
        default:
            return 'bg-gray-100 text-gray-700';
    }
};

export const getGrowthColor = (growth: number): string => {
    if (growth >= 30) return 'text-green-600';
    if (growth >= 15) return 'text-blue-600';
    return 'text-gray-600';
};

interface TeamMemberRowProps {
    member: TeamMember;
    index: number;
}

export const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member, index }) => {
    const { t } = useTranslation();

    return (
        <motion.tr
            key={member.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="hover:bg-zinc-100 dark:bg-zinc-800/30 transition-colors"
        >
            <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                    <img
                        src={member.avatarUrl}
                        alt={member.name}
                        className="w-10 h-10 rounded-full ring-2 ring-white/20"
                    />
                    <div>
                        <p className="font-medium text-white">{member.name}</p>
                        <p className="text-xs text-zinc-400">{member.email}</p>
                    </div>
                </div>
            </td>
            <td className="px-6 py-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRankBadgeColor(member.rank)}`}>
                    {RANK_NAMES[member.rank]}
                </span>
            </td>
            <td className="px-6 py-4 text-right font-medium text-white">
                {formatVND(member.personalSales)}
            </td>
            <td className="px-6 py-4 text-right font-medium text-white">
                {formatVND(member.teamVolume)}
            </td>
            <td className="px-6 py-4 text-center">
                <span className="text-sm font-medium text-zinc-300">{member.activeDownlines}</span>
            </td>
            <td className="px-6 py-4 text-center">
                <span className={`text-sm font-bold ${getGrowthColor(member.monthlyGrowth)}`}>
                    +{member.monthlyGrowth}%
                </span>
            </td>
            <td className="px-6 py-4">
                <div className="flex items-center justify-center gap-2">
                    <button className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-700 rounded-lg transition-all duration-200 group" title={t('team.actions.sendEmail')}>
                        <Mail className="w-4 h-4 text-zinc-400 group-hover:text-blue-400 transition-colors duration-200" />
                    </button>
                    <button className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-700 rounded-lg transition-all duration-200 group" title={t('team.actions.call')}>
                        <Phone className="w-4 h-4 text-zinc-400 group-hover:text-green-400 transition-colors duration-200" />
                    </button>
                    <button className="p-2 hover:bg-zinc-100 dark:bg-zinc-800 active:bg-zinc-700 rounded-lg transition-all duration-200 group" title={t('team.actions.moreActions')}>
                        <MoreVertical className="w-4 h-4 text-zinc-400 group-hover:text-purple-400 transition-colors duration-200" />
                    </button>
                </div>
            </td>
        </motion.tr>
    );
};
