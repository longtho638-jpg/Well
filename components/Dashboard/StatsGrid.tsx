
import React from 'react';
import { User } from '../../types';
import { formatVND } from '../../utils/format';
import { TrendingUp, Users, CalendarClock, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface Props {
  user: User;
}

export const StatsGrid: React.FC<Props> = ({ user }) => {
  return (
    <>
      {/* Personal Sales */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-teal-50 rounded-xl text-brand-primary">
                <TrendingUp className="w-6 h-6" />
            </div>
            <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 12%
            </span>
        </div>
        <p className="text-gray-500 text-xs uppercase font-bold tracking-wide mb-1">Personal Sales</p>
        <h3 className="text-2xl font-bold text-brand-dark">{formatVND(user.totalSales)}</h3>
      </motion.div>

      {/* Team Volume */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                <Users className="w-6 h-6" />
            </div>
            <span className="bg-green-50 text-green-600 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" /> 8%
            </span>
        </div>
        <p className="text-gray-500 text-xs uppercase font-bold tracking-wide mb-1">Team Volume</p>
        <h3 className="text-2xl font-bold text-brand-dark">{formatVND(user.teamVolume)}</h3>
      </motion.div>

      {/* Payout Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-brand-dark p-6 rounded-2xl shadow-lg text-white relative overflow-hidden group"
      >
        <div className="absolute right-0 top-0 w-20 h-20 bg-brand-primary opacity-20 rounded-bl-full transition-transform group-hover:scale-110"></div>
        
        <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-3 bg-white/10 rounded-xl text-brand-accent backdrop-blur-sm">
                <CalendarClock className="w-6 h-6" />
            </div>
            <div className="text-right">
                <p className="text-gray-400 text-[10px] uppercase font-bold">Next Payout</p>
                <p className="font-bold text-brand-accent">{user.nextPayoutDate}</p>
            </div>
        </div>
        <p className="text-gray-400 text-xs uppercase font-bold tracking-wide mb-1 relative z-10">Estimated Bonus</p>
        <h3 className="text-2xl font-bold text-white relative z-10">{formatVND(user.estimatedBonus || 0)}</h3>
      </motion.div>
    </>
  );
};
