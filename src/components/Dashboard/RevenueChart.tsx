
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
        className="col-span-1 lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-[340px]"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
            <h3 className="font-bold text-lg text-brand-dark dark:text-slate-100">Revenue Growth</h3>
            <p className="text-gray-400 dark:text-slate-500 text-xs mt-0.5">Last 7 days performance</p>
        </div>
        {/* Filter Dropdown styled with standard Tailwind forms */}
        <div className="relative">
            <select className="appearance-none bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-xs font-semibold text-gray-600 dark:text-slate-300 rounded-lg pl-3 pr-8 py-2 outline-none focus:ring-2 focus:ring-brand-primary/20 dark:focus:ring-teal-500/40 cursor-pointer transition-all hover:border-brand-primary/30 dark:hover:border-teal-500/50">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500 dark:text-slate-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            {/* Deep Teal Gradient */}
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00575A" stopOpacity={0.15}/>
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
                border: '1px solid #374151', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                color: '#F3F4F6',
                padding: '8px 12px'
            }}
            itemStyle={{ color: '#FFBF00', fontWeight: 600, fontSize: '13px' }}
            formatter={(value: number) => [formatVND(value), "Revenue"]}
            labelStyle={{ color: '#9CA3AF', marginBottom: '4px', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}
            cursor={{ stroke: '#00575A', strokeWidth: 1, strokeDasharray: '4 4' }}
          />
          
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#00575A" 
            strokeWidth={3} 
            fill="url(#colorRevenue)" 
            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: '#FFBF00' }}
            animationDuration={1500}
          />
        </AreaChart>
      </ResponsiveContainer>
    </motion.div>
  );
};
