import React from 'react';
import { motion } from 'framer-motion';

// ============================================================================
// MINIMALIST CARD - EAST ASIAN STYLE
// ============================================================================

interface MinimalistCardProps {
    children: React.ReactNode;
    className?: string;
    accentColor?: 'jade' | 'gold' | 'sakura' | 'ocean';
}

export function MinimalistCard({
    children,
    className = '',
    accentColor = 'jade'
}: MinimalistCardProps) {
    const accentColors = {
        jade: 'hover:border-emerald-500/30',
        gold: 'hover:border-amber-500/30',
        sakura: 'hover:border-pink-500/30',
        ocean: 'hover:border-cyan-500/30',
    };

    return (
        <motion.div
            className={`
        relative bg-zinc-900/30 backdrop-blur-sm
        border border-zinc-800/50 rounded-2xl
        ${accentColors[accentColor]}
        transition-all duration-500 ease-out
        ${className}
      `}
            whileHover={{
                y: -8,
                transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] }
            }}
        >
            {children}
        </motion.div>
    );
}
