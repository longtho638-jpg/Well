
import React from 'react';
import { User } from '../../types';
import { formatVND } from '../../utils/format';
import { motion } from 'framer-motion';
import { Copy, Trophy } from 'lucide-react';

interface Props {
  user: User;
}

export const HeroCard: React.FC<Props> = ({ user }) => {
  // Gamification Logic
  const TARGET_VOLUME = 100000000;
  const progressPercent = Math.min((user.teamVolume / TARGET_VOLUME) * 100, 100);

  return (
    <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="col-span-1 md:col-span-2 lg:col-span-3 bg-gradient-to-r from-brand-primary to-[#004245] rounded-2xl p-8 text-white relative overflow-hidden shadow-xl"
    >
        {/* Abstract Shapes */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl -mr-12 -mt-12"></div>
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-brand-accent opacity-10 rounded-full blur-3xl"></div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
            <div className="flex-1 w-full">
                <div className="flex items-center gap-2 mb-2">
                    <div className="bg-brand-accent text-brand-primary text-[10px] font-bold px-2 py-1 rounded uppercase flex items-center gap-1">
                        <Trophy className="w-3 h-3" /> Founder Club Quest
                    </div>
                </div>
                
                <h2 className="text-3xl font-bold mb-2 text-white tracking-tight">Road to Founder Club</h2>
                <p className="text-teal-100 text-sm mb-6 max-w-lg">
                    Hit 100M Team Volume to unlock the "Founder" badge and receive 2% Global Bonus Pool sharing.
                </p>

                {/* Progress Bar */}
                <div className="bg-black/20 rounded-full h-3 w-full max-w-md mb-2 overflow-hidden border border-white/5">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercent}%` }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="h-full bg-brand-accent shadow-[0_0_15px_rgba(255,191,0,0.5)]"
                    />
                </div>
                <div className="flex justify-between max-w-md text-xs text-teal-200 font-medium">
                    <span>Current: {formatVND(user.teamVolume)}</span>
                    <span className="text-brand-accent">Goal: {formatVND(TARGET_VOLUME)}</span>
                </div>
            </div>

            {/* Referral Link Box */}
            <div className="w-full md:w-auto bg-white/10 backdrop-blur-md border border-white/10 p-4 rounded-xl min-w-[280px]">
                <p className="text-teal-200 text-xs uppercase font-bold mb-2 tracking-wide">Your Referral Link</p>
                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg mb-3">
                    <code className="text-xs text-white truncate flex-1">{user.referralLink || `wellnexus.vn/ref/${user.id}`}</code>
                    <button className="text-brand-accent hover:text-white transition-colors">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <button className="w-full bg-brand-accent hover:bg-yellow-400 text-brand-primary font-bold py-2.5 rounded-lg text-sm transition shadow-lg shadow-yellow-500/20">
                    Share Now
                </button>
            </div>
        </div>
    </motion.div>
  );
};
