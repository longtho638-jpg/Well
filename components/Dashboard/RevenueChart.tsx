
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartDataPoint } from '../../types';
import { formatVND, formatCompact } from '../../utils/format';
import { motion } from 'framer-motion';

interface Props {
  data: ChartDataPoint[];
}

export const RevenueChart: React.FC<Props> = ({ data }) => {
  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="col-span-1 lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm h-[340px]"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="font-bold text-lg text-brand-dark">Revenue Growth</h3>
            <p className="text-gray-400 text-xs">Last 7 days performance</p>
        </div>
        <select className="bg-gray-50 border border-gray-200 text-xs font-medium text-gray-600 rounded-lg px-3 py-1.5 outline-none">
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
        </select>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00575A" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#00575A" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 500}} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fill: '#9CA3AF', fontSize: 11, fontWeight: 500}} 
            tickFormatter={formatCompact}
            dx={-10}
          />
          <Tooltip 
            contentStyle={{ 
                backgroundColor: '#1F2937', 
                borderRadius: '12px', 
                border: 'none', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                color: '#F3F4F6'
            }}
            itemStyle={{ color: '#FFBF00', fontWeight: 600 }}
            formatter={(value: number) => [formatVND(value), "Revenue"]}
            labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem', fontSize: '12px' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#00575A" 
            strokeWidth={3} 
            fill="url(#colorVal)" 
            activeDot={{ r: 6, strokeWidth: 0, fill: '#FFBF00' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
