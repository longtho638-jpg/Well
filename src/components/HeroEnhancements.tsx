/**
 * Hero Stats Counter Component
 * Phase 18: Homepage WOW Enhancement
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useTranslation } from '@/hooks';

// ============================================================================
// ANIMATED COUNTER
// ============================================================================

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

            // Easing function (ease out cubic)
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

// ============================================================================
// HERO STATS BAR
// ============================================================================

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

// ============================================================================
// LIVE SOCIAL PROOF TICKER
// ============================================================================

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

// ============================================================================
// TESTIMONIALS CAROUSEL
// ============================================================================

interface Testimonial {
    name: string;
    role: string;
    content: string;
    avatar?: string;
    rating: number;
}

interface TestimonialsProps {
    testimonials: Testimonial[];
}

export function TestimonialsCarousel({ testimonials }: TestimonialsProps) {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % testimonials.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [testimonials.length]);

    return (
        <div className="relative max-w-4xl mx-auto">
            <div className="overflow-hidden">
                <motion.div
                    className="flex"
                    animate={{ x: `-${current * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                    {testimonials.map((testimonial, index) => (
                        <div key={index} className="w-full flex-shrink-0 px-4">
                            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl p-6 sm:p-8 md:p-12 text-center">
                                {/* Stars */}
                                <div className="flex justify-center gap-1 mb-6">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`w-5 h-5 ${i < testimonial.rating ? 'text-amber-400' : 'text-zinc-700'}`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>

                                {/* Quote */}
                                <p className="text-xl md:text-2xl text-zinc-300 italic mb-8 leading-relaxed">
                                    "{testimonial.content}"
                                </p>

                                {/* Author */}
                                <div className="flex items-center justify-center gap-4">
                                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                                        {testimonial.avatar || testimonial.name.charAt(0)}
                                    </div>
                                    <div className="text-left">
                                        <p className="font-bold text-white">{testimonial.name}</p>
                                        <p className="text-sm text-zinc-500">{testimonial.role}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Dots - with adequate touch targets */}
            <div className="flex justify-center gap-2 mt-6">
                {testimonials.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className="p-2 -m-1 touch-manipulation"
                        aria-label={`Go to testimonial ${index + 1}`}
                    >
                        <span className={`block rounded-full transition-all ${index === current ? 'bg-emerald-500 w-6 h-2' : 'bg-zinc-700 w-2 h-2'
                            }`} />
                    </button>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// TRUST BADGES
// ============================================================================

interface TrustBadgesProps {
    badges: Array<{ name: string; logo?: string }>;
}

export function TrustBadges({ badges }: TrustBadgesProps) {
    const { t } = useTranslation();
    return (
        <div className="py-12 border-y border-zinc-800">
            <p className="text-center text-sm text-zinc-500 mb-8 uppercase tracking-widest">
                {t('heroenhancements.c_tin_t_ng_b_i')}</p>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
                {badges.map((badge, index) => (
                    <motion.div
                        key={index}
                        className="text-zinc-400 font-bold text-lg md:text-xl"
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        {badge.logo ? (
                            <img src={badge.logo} alt={badge.name} className="h-8 md:h-10" />
                        ) : (
                            badge.name
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// DATA FOR LANDING PAGE
// ============================================================================

export const TRUST_BADGES = [
    { name: 'VNPay' },
    { name: 'Momo' },
    { name: 'Google Cloud' },
    { name: 'Firebase' },
    { name: 'Stripe' },
];
