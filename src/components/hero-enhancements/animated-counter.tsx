/**
 * Animated counter with scroll-triggered animation
 * Counts from 0 to target value with easing
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface CounterProps {
    end: number;
    duration?: number;
    suffix?: string;
    prefix?: string;
    label: string;
    icon?: React.ReactNode;
}

export function AnimatedCounter({
    end,
    duration = 2,
    suffix = '',
    prefix = '',
    label,
    icon,
}: CounterProps) {
    const [count, setCount] = useState(0);
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });

    useEffect(() => {
        if (!isInView) return;

        const startTime = Date.now();
        const endTime = startTime + duration * 1000;

        const tick = () => {
            const now = Date.now();
            const progress = Math.min(1, (now - startTime) / (duration * 1000));
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));

            if (now < endTime) {
                requestAnimationFrame(tick);
            } else {
                setCount(end);
            }
        };

        tick();
    }, [isInView, end, duration]);

    const formatNumber = (n: number) => {
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
        return n.toLocaleString('vi-VN');
    };

    return (
        <motion.div
            ref={ref}
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
        >
            <div className="flex items-center justify-center gap-2 mb-2">
                {icon}
                <span className="text-2xl sm:text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                    {prefix}{formatNumber(count)}{suffix}
                </span>
            </div>
            <span className="text-sm text-zinc-400 font-medium">{label}</span>
        </motion.div>
    );
}

interface StatItem {
    value: number;
    suffix?: string;
    prefix?: string;
    label: string;
}

interface HeroStatsProps {
    stats: StatItem[];
}

export function HeroStats({ stats }: HeroStatsProps) {
    return (
        <motion.div
            className="w-full max-w-4xl mx-auto mt-16"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
        >
            <div className="bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-2xl p-6 md:p-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                    {stats.map((stat, index) => (
                        <AnimatedCounter
                            key={index}
                            end={stat.value}
                            suffix={stat.suffix}
                            prefix={stat.prefix}
                            label={stat.label}
                        />
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
