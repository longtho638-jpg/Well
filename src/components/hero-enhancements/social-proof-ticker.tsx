/**
 * Live social proof ticker — shows recent user activity
 * Fixed to bottom-left with rotating messages
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface ProofItem {
    name: string;
    action: string;
    time: string;
    avatar?: string;
}

interface SocialProofTickerProps {
    items: ProofItem[];
}

export function SocialProofTicker({ items }: SocialProofTickerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % items.length);
        }, 3000);
        return () => clearInterval(interval);
    }, [items.length]);

    const current = items[currentIndex];

    return (
        <motion.div
            className="fixed bottom-20 sm:bottom-6 left-4 sm:left-6 z-40 max-w-[calc(100vw-2rem)] sm:max-w-sm"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2 }}
        >
            <motion.div
                key={currentIndex}
                className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 rounded-2xl p-4 shadow-2xl max-w-sm"
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm">
                        {current.avatar || current.name.charAt(0)}
                    </div>
                    <div>
                        <p className="text-sm text-white font-medium">
                            <span className="text-emerald-400">{current.name}</span> {current.action}
                        </p>
                        <p className="text-xs text-zinc-500">{current.time}</p>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
