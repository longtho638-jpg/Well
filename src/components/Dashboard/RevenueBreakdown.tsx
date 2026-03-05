import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { PieChart } from 'recharts';
import { Pie } from 'recharts';
import { Cell } from 'recharts';
import { ResponsiveContainer } from 'recharts';
import { Tooltip } from 'recharts';
import { useTranslation } from '@/hooks';

interface RevenueItem {
    name: string;
    value: number;
    color: string;
}

interface RevenueBreakdownProps {
    data: RevenueItem[];
    totalSales: number;
}

export const RevenueBreakdown: React.FC<RevenueBreakdownProps> = ({ data, totalSales }) => {
    const { t } = useTranslation();

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-zinc-950/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 shadow-2xl p-8 group overflow-hidden relative"
        >
            <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:scale-125 transition-transform duration-[3s] text-emerald-500">
                <TrendingUp size={150} />
            </div>

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 shadow-xl">
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-widest italic">
                    {t('dashboard.revenueBreakdown.title')}
                </h3>
            </div>

            <div className="h-[220px] mb-8 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={65}
                            outerRadius={95}
                            paddingAngle={8}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#09090b',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '1rem',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                            formatter={(value: number) => [`${(value / 1000000).toFixed(1)}M ₫`, t('dashboard.revenueBreakdown.yield')]}
                        />
                    </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('revenuebreakdown.total_yield')}</span>
                    <span className="text-xl font-black text-white italic tracking-tighter">{t('revenuebreakdown.100')}</span>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {data.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between group/item">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 blur-sm opacity-20" style={{ backgroundColor: item.color }} />
                                <div className="w-2.5 h-2.5 rounded-full border border-white/10 relative" style={{ backgroundColor: item.color }} />
                            </div>
                            <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest group-hover/item:text-zinc-300 transition-colors">
                                {item.name}
                            </span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="h-px w-8 bg-white/5" />
                            <span className="text-xs font-black text-white italic tracking-tighter">
                                {((item.value / totalSales) * 100).toFixed(0)}%
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
