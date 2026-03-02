/**
 * founder-revenue-goal-progress-ring-svg
 * Animated SVG circular progress ring sub-component for FounderRevenueGoal widget
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks/useTranslation';

interface ProgressRingProps {
    percentage: number;
}

export const FounderProgressRing: React.FC<ProgressRingProps> = ({ percentage }) => {
    const { t } = useTranslation();
    const radius = 60;
    const strokeWidth = 10;
    const normalizedRadius = radius - strokeWidth / 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative w-32 h-32">
            <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
                <circle
                    stroke="#374151"
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
                <motion.circle
                    stroke={percentage >= 100 ? '#10b981' : percentage >= 50 ? '#f59e0b' : '#ef4444'}
                    fill="transparent"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                    r={normalizedRadius}
                    cx={radius}
                    cy={radius}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-zinc-100">{percentage.toFixed(1)}%</span>
                <span className="text-xs text-zinc-500">{t('founderrevenuegoal.of_goal')}</span>
            </div>
        </div>
    );
};
