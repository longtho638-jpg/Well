import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Zap } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { UserRank } from '@/types';

interface RankProgressBarProps {
    currentRank: UserRank;
    accumulatedBonusRevenue: number;
}

const RankProgressBar: React.FC<RankProgressBarProps> = ({
    currentRank,
    accumulatedBonusRevenue,
}) => {
    // Only show for CTV rank (before Khởi Nghiệp upgrade)
    if (currentRank !== UserRank.CTV) {
        return null;
    }

    const threshold = 9900000; // 9.9M VND
    const progress = Math.min((accumulatedBonusRevenue / threshold) * 100, 100);
    const remaining = Math.max(threshold - accumulatedBonusRevenue, 0);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-6 shadow-sm"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="bg-amber-100 dark:bg-amber-900/40 p-2 rounded-lg">
                        <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                            Rank Upgrade Progress
                        </h3>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                            Upgrade to <span className="font-bold text-amber-600 dark:text-amber-400">Khởi Nghiệp</span> (25% commission)
                        </p>
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {progress.toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        Complete
                    </div>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 dark:from-amber-500 dark:to-yellow-600 rounded-full relative overflow-hidden"
                    >
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                    </motion.div>
                </div>
                <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mt-1">
                    <span>{formatVND(accumulatedBonusRevenue)}</span>
                    <span>{formatVND(threshold)}</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        Remaining
                    </div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                        {formatVND(remaining)}
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-lg">
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                        After Upgrade
                    </div>
                    <div className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Zap className="w-4 h-4" />
                        25% Rate
                    </div>
                </div>
            </div>

            {/* Encouragement */}
            {progress >= 80 && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-600 dark:to-yellow-600 text-white text-sm font-medium p-3 rounded-lg flex items-center gap-2"
                >
                    <TrendingUp className="w-4 h-4" />
                    <span>Almost there! Just {formatVND(remaining)} more to Khởi Nghiệp rank! 🚀</span>
                </motion.div>
            )}
        </motion.div>
    );
};

export default RankProgressBar;
