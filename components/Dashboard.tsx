
import React from 'react';
import { User } from '../types';
import { SALES_DATA } from '../services/mockData';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar
} from 'recharts';
import { TrendingUp, Users, Award, Copy, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  user: User;
}

const Dashboard: React.FC<Props> = ({ user }) => {
  return (
    <div className="space-y-8">
      {/* HERO SECTION: Founder Club Progress */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-gradient-to-r from-deepTeal to-teal-800 rounded-2xl p-8 text-white overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-marigold opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="w-full md:w-2/3">
            <div className="flex items-center gap-2 mb-2">
                <div className="bg-marigold text-deepTeal text-xs font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                    <Zap className="w-3 h-3" /> 30-Day Challenge
                </div>
                <span className="text-teal-200 text-sm">Day 12 of 30</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">Road to Founder Club</h2>
            
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-teal-800 bg-teal-200">
                    Partner Rank
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-marigold">
                    75% Completed
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-4 mb-4 text-xs flex rounded-full bg-black/20 border border-white/10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-yellow-400 to-marigold"
                ></motion.div>
              </div>
              <p className="text-sm text-teal-100">
                You need <span className="font-bold text-white">15.000.000 ₫</span> more team volume to unlock the "Founder" badge and 2% global bonus.
              </p>
            </div>
          </div>

          <div className="w-full md:w-1/3 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
             <p className="text-teal-200 text-xs uppercase tracking-wide mb-1">Your Referral Link</p>
             <div className="flex items-center gap-2 bg-black/20 rounded-lg p-2 mb-2">
                <code className="text-sm truncate flex-1 text-teal-50">wellnexus.vn/ref/{user.id}</code>
                <button className="text-marigold hover:text-yellow-300">
                    <Copy className="w-4 h-4" />
                </button>
             </div>
             <button className="w-full bg-marigold hover:bg-yellow-500 text-deepTeal font-bold py-2 rounded-lg text-sm transition shadow-lg shadow-yellow-900/20">
                Share Now
             </button>
          </div>
        </div>
      </motion.div>

      {/* STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-teal-50 rounded-full text-deepTeal">
                <TrendingUp className="w-6 h-6" />
            </div>
            <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Personal Sales</p>
                <h3 className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: "compact" }).format(user.totalSales)}
                </h3>
            </div>
          </div>
          <div className="text-xs text-green-600 flex items-center font-medium">
            +12.5% <span className="text-gray-400 ml-1">vs last month</span>
          </div>
        </motion.div>

        <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-50 rounded-full text-purple-700">
                <Users className="w-6 h-6" />
            </div>
            <div>
                <p className="text-gray-500 text-xs uppercase font-bold">Team Volume</p>
                <h3 className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', notation: "compact" }).format(user.teamVolume)}
                </h3>
            </div>
          </div>
           <div className="text-xs text-green-600 flex items-center font-medium">
            Active Members: 14
          </div>
        </motion.div>

        <motion.div 
             initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
             className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl shadow-sm border border-slate-700 text-white"
        >
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-400 text-xs uppercase font-bold mb-1">Next Payout</p>
                    <h3 className="text-2xl font-bold text-marigold">15 Jun</h3>
                </div>
                <Award className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-sm text-slate-300 mt-4">
                Estimated Bonus: <span className="text-white font-bold">2.400.000 ₫</span>
            </p>
        </motion.div>
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2 h-80"
        >
            <h3 className="font-bold text-gray-800 mb-6">Revenue Growth (7 Days)</h3>
            <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={SALES_DATA}>
                <defs>
                <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00575A" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#00575A" stopOpacity={0}/>
                </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(val) => new Intl.NumberFormat('en', { notation: "compact" }).format(val)} />
                <Tooltip 
                    contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    formatter={(value: number) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), "Sales"]}
                />
                <Area type="monotone" dataKey="sales" stroke="#00575A" strokeWidth={3} fill="url(#colorSales)" />
            </AreaChart>
            </ResponsiveContainer>
        </motion.div>
        
        <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
             className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-80"
        >
            <h3 className="font-bold text-gray-800 mb-2">Top Products</h3>
            <p className="text-xs text-gray-500 mb-6">Based on personal link clicks</p>
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            <img src={`https://picsum.photos/100?random=${i}`} className="w-full h-full object-cover" alt="product" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">Combo ANIMA 119</p>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                                <div className="bg-deepTeal h-1.5 rounded-full" style={{ width: `${80 - (i * 20)}%`}}></div>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-gray-500">{80 - (i * 20)}%</span>
                    </div>
                ))}
            </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
