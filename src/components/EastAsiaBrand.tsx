/**
 * East Asia Brand 2026 Design System
 * Phase 21: Enterprise-Level Design for Southeast Asian Market
 * 
 * Trends:
 * - Minimalist Luxury
 * - Zen Aesthetics
 * - Organic Gradients
 * - Scroll Storytelling
 * - Premium Typography
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

// ============================================================================
// EAST ASIAN COLOR PALETTE - 2026 TRENDS
// ============================================================================

export const EA_COLORS = {
    // Zen Neutrals
    ink: '#0a0a0a',
    charcoal: '#1a1a1a',
    stone: '#2a2a2a',
    mist: '#f5f5f5',

    // Nature-Inspired Accents
    jade: '#00897b',
    bamboo: '#4caf50',
    sakura: '#ec407a',
    gold: '#ffc107',
    ocean: '#0288d1',

    // Premium Gradients
    zenGradient: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0d2818 100%)',
    goldShimmer: 'linear-gradient(90deg, #ffc107 0%, #ffecb3 50%, #ffc107 100%)',
    jadeFlow: 'linear-gradient(135deg, #004d40 0%, #00897b 50%, #26a69a 100%)',
};

// ============================================================================
// SCROLL REVEAL SECTION (Storytelling)
// ============================================================================

interface ScrollRevealSectionProps {
    children: React.ReactNode;
    className?: string;
}

export function ScrollRevealSection({ children, className = '' }: ScrollRevealSectionProps) {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-20%' });

    return (
        <motion.div
            ref={ref}
            className={className}
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// ZEN DIVIDER
// ============================================================================

export function ZenDivider({ className = '' }: { className?: string }) {
    return (
        <div className={`flex items-center justify-center gap-6 py-12 ${className}`}>
            <motion.div
                className="h-[1px] w-24 bg-gradient-to-r from-transparent to-zinc-700"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            />
            <motion.div
                className="w-2 h-2 rounded-full bg-emerald-500/50"
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
            />
            <motion.div
                className="h-[1px] w-24 bg-gradient-to-l from-transparent to-zinc-700"
                initial={{ scaleX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
            />
        </div>
    );
}

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

// ============================================================================
// AWARDS & CERTIFICATIONS BAR
// ============================================================================

interface AwardItem {
    icon: string;
    title: string;
    subtitle?: string;
}

interface AwardsBarProps {
    awards: AwardItem[];
    className?: string;
}

export function AwardsBar({ awards, className = '' }: AwardsBarProps) {
    return (
        <div className={`border-y border-zinc-800/50 py-8 ${className}`}>
            <div className="max-w-7xl mx-auto px-6">
                <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
                    {awards.map((award, index) => (
                        <motion.div
                            key={index}
                            className="flex items-center gap-3 text-zinc-400"
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.1, duration: 0.5 }}
                        >
                            <span className="text-2xl">{award.icon}</span>
                            <div className="text-left">
                                <div className="text-sm font-semibold text-zinc-200">{award.title}</div>
                                {award.subtitle && (
                                    <div className="text-xs text-zinc-500">{award.subtitle}</div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// FLOATING NAV - EAST ASIAN MINIMAL
// ============================================================================

export function FloatingNav() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            className={`
        fixed top-4 left-1/2 -translate-x-1/2 z-50
        px-8 py-3 rounded-2xl
        backdrop-blur-xl border
        transition-all duration-500
        ${scrolled
                    ? 'bg-zinc-900/90 border-zinc-700/50 shadow-2xl'
                    : 'bg-transparent border-transparent'
                }
      `}
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
        >
            <div className="flex items-center gap-8">
                <span className="font-bold text-lg text-white">WellNexus</span>
                <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
                    <a href="#about" className="hover:text-white transition-colors">Về Chúng Tôi</a>
                    <a href="#products" className="hover:text-white transition-colors">Sản Phẩm</a>
                    <a href="#partners" className="hover:text-white transition-colors">Đối Tác</a>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                    Bắt Đầu
                </button>
            </div>
        </motion.nav>
    );
}

// ============================================================================
// SCROLL PROGRESS INDICATOR
// ============================================================================

export function ScrollProgress() {
    const { scrollYProgress } = useScroll();
    const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 });

    return (
        <motion.div
            className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-emerald-500 origin-left z-50"
            style={{ scaleX }}
        />
    );
}

// ============================================================================
// PARALLAX IMAGE
// ============================================================================

interface ParallaxImageProps {
    src: string;
    alt: string;
    className?: string;
    speed?: number;
}

export function ParallaxImage({ src, alt, className = '', speed = 0.3 }: ParallaxImageProps) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ['start end', 'end start'],
    });
    const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

    return (
        <div ref={ref} className={`overflow-hidden ${className}`}>
            <motion.img
                src={src}
                alt={alt}
                className="w-full h-[120%] object-cover"
                style={{ y }}
            />
        </div>
    );
}

// ============================================================================
// STAGGERED TEXT REVEAL
// ============================================================================

interface StaggeredTextProps {
    text: string;
    className?: string;
    tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
}

export function StaggeredText({ text, className = '', tag: Tag = 'h2' }: StaggeredTextProps) {
    const words = text.split(' ');

    return (
        <Tag className={className}>
            {words.map((word, index) => (
                <motion.span
                    key={index}
                    className="inline-block mr-2"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-50px' }}
                    transition={{
                        delay: index * 0.1,
                        duration: 0.6,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    {word}
                </motion.span>
            ))}
        </Tag>
    );
}

// ============================================================================
// VIETNAM / EAST ASIAN NUMBER FORMAT
// ============================================================================

export function formatVND(amount: number): string {
    if (amount >= 1_000_000_000) {
        return `${(amount / 1_000_000_000).toFixed(1)} tỷ`;
    }
    if (amount >= 1_000_000) {
        return `${(amount / 1_000_000).toFixed(0)} triệu`;
    }
    return amount.toLocaleString('vi-VN');
}

// ============================================================================
// DATA FOR EAST ASIAN BRAND
// ============================================================================

export const EA_AWARDS = [
    { icon: '🏆', title: 'Top 10 Startup', subtitle: 'Vietnam 2025' },
    { icon: '🌏', title: 'SEA Expansion', subtitle: '4 Countries' },
    { icon: '💎', title: 'Premium Partner', subtitle: 'Grade A+' },
    { icon: '🔒', title: 'ISO 27001', subtitle: 'Security Certified' },
];
