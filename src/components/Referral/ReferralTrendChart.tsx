import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatVND } from '@/utils/format';

interface ReferralTrendChartProps {
    data: { month: string; referrals: number; revenue: number }[];
}

export const ReferralTrendChart: React.FC<ReferralTrendChartProps> = ({ data }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-12 rounded-[3rem] shadow-2xl"
    >
        <div className="flex items-center gap-6 mb-10">
            <div className="w-12 h-12 bg-white text-zinc-950 rounded-2xl flex items-center justify-center">
                <TrendingUp size={24} />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Propagation Velocity</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">Growth & Yield Trajectory</p>
            </div>
        </div>

        <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                    <defs>
                        <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#2dd4bf" />
                            <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }}
                        dy={10}
                    />
                    <YAxis
                        yAxisId="left"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }}
                    />
                    <YAxis
                        yAxisId="right"
                        orientation="right"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#71717a', fontSize: 10, fontWeight: 900 }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#09090b',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '1rem',
                            padding: '1rem'
                        }}
                        itemStyle={{
                            fontSize: '10px',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em'
                        }}
                        cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 2 }}
                        formatter={(value: number, name: string) =>
                            name === 'revenue' ? formatVND(value) : value
                        }
                    />
                    <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="referrals"
                        stroke="url(#lineGradient)"
                        strokeWidth={4}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6, fill: '#fff' }}
                        name="Nodes"
                    />
                    <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="revenue"
                        stroke="#FFBF00"
                        strokeWidth={4}
                        dot={{ r: 0 }}
                        activeDot={{ r: 6, fill: '#fff' }}
                        name="Yield"
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    </motion.div>
);
