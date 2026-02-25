/**
 * Team Charts Component
 * Network Health and Rank Distribution pie charts
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Award } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { TeamMember, UserRank } from '@/types';
import { useTranslation } from '@/hooks';

interface TeamChartsProps {
    teamMembers: TeamMember[];
}

export function TeamCharts({ teamMembers }: TeamChartsProps) {
    const { t } = useTranslation();

    // Network Health Data
    const activeCount = teamMembers.filter(m => m.monthlyGrowth > 0).length;
    const inactiveCount = teamMembers.length - activeCount;

    const networkHealthData = [
        { name: 'Active', value: activeCount, color: '#10B981' },
        { name: 'At Risk', value: Math.floor(teamMembers.length * 0.15), color: '#F59E0B' },
        { name: 'Inactive', value: inactiveCount - Math.floor(teamMembers.length * 0.15), color: '#EF4444' }
    ];

    const rankDistribution = [
        { name: t('common.rank.daisu'), value: teamMembers.filter(m => m.rank === UserRank.DAI_SU).length, color: '#00575A' },
        { name: t('common.rank.ctv'), value: teamMembers.filter(m => m.rank === UserRank.CTV).length, color: '#FFBF00' }
    ];

    const tooltipStyle = {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        borderRadius: '12px',
        color: 'white'
    };

    return (
        <div className="grid md:grid-cols-2 gap-6">
            {/* Network Health */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="relative group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-cyan-400" />
                        {t('leaderdashboard.network_health')}</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={networkHealthData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={90}
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                            >
                                {networkHealthData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>

                    {/* Legend */}
                    <div className="flex justify-center gap-4 mt-4">
                        {networkHealthData.map((item, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-zinc-400 text-sm">{item.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* Rank Distribution */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="relative group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl blur-xl opacity-50" />
                <div className="relative bg-zinc-900/50 backdrop-blur-xl rounded-2xl p-6 border border-zinc-800">
                    <h3 className="font-bold text-white text-lg mb-4 flex items-center gap-2">
                        <Award className="w-5 h-5 text-purple-400" />
                        {t('team.charts.rankDistribution')}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={rankDistribution}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                                outerRadius={90}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {rankDistribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
