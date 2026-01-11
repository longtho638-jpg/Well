/**
 * Premium UI Effects - MAX LEVEL WOW
 * Phase 19: Ultra-Premium Visual Enhancement
 */

import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

// ============================================================================
// ANIMATED GRADIENT BACKGROUND
// ============================================================================

export function AnimatedGradientBg() {
    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {/* Animated gradient orbs */}
            <motion.div
                className="absolute w-[800px] h-[800px] rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="absolute right-0 top-1/4 w-[600px] h-[600px] rounded-full opacity-20"
                style={{
                    background: 'radial-gradient(circle, rgba(99, 102, 241, 0.4) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: [0, -80, 0],
                    y: [0, 100, 0],
                    scale: [1.1, 0.9, 1.1],
                }}
                transition={{
                    duration: 18,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
            <motion.div
                className="absolute left-1/4 bottom-0 w-[500px] h-[500px] rounded-full opacity-25"
                style={{
                    background: 'radial-gradient(circle, rgba(236, 72, 153, 0.3) 0%, transparent 70%)',
                    filter: 'blur(60px)',
                }}
                animate={{
                    x: [0, 60, 0],
                    y: [0, -80, 0],
                    scale: [1, 1.15, 1],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: 'easeInOut',
                }}
            />
        </div>
    );
}

// ============================================================================
// FLOATING ELEMENTS
// ============================================================================

interface FloatingElementProps {
    children: React.ReactNode;
    delay?: number;
    duration?: number;
    distance?: number;
}

export function FloatingElement({
    children,
    delay = 0,
    duration = 3,
    distance = 15,
}: FloatingElementProps) {
    return (
        <motion.div
            animate={{
                y: [0, -distance, 0],
                rotate: [0, 3, 0, -3, 0],
            }}
            transition={{
                duration,
                delay,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// GLASSMORPHISM CARD
// ============================================================================

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
    glow?: 'emerald' | 'violet' | 'pink' | 'cyan' | 'amber';
    hover?: boolean;
}

export function GlassCard({
    children,
    className = '',
    glow = 'emerald',
    hover = true,
}: GlassCardProps) {
    const glowColors = {
        emerald: 'hover:shadow-emerald-500/20',
        violet: 'hover:shadow-violet-500/20',
        pink: 'hover:shadow-pink-500/20',
        cyan: 'hover:shadow-cyan-500/20',
        amber: 'hover:shadow-amber-500/20',
    };

    const borderColors = {
        emerald: 'hover:border-emerald-500/50',
        violet: 'hover:border-violet-500/50',
        pink: 'hover:border-pink-500/50',
        cyan: 'hover:border-cyan-500/50',
        amber: 'hover:border-amber-500/50',
    };

    return (
        <motion.div
            className={`
        relative backdrop-blur-xl bg-white/5 
        border border-white/10 rounded-3xl
        ${hover ? `${glowColors[glow]} ${borderColors[glow]} hover:shadow-2xl` : ''}
        transition-all duration-500 ${className}
      `}
            whileHover={hover ? { scale: 1.02, y: -5 } : undefined}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
            {/* Glass shine effect */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
                <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-white/10 to-transparent rotate-12" />
            </div>
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}

// ============================================================================
// CURSOR GLOW EFFECT
// ============================================================================

export function CursorGlow() {
    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 200 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX - 200);
            cursorY.set(e.clientY - 200);
        };

        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, [cursorX, cursorY]);

    return (
        <motion.div
            className="pointer-events-none fixed inset-0 z-30"
            style={{
                background: 'radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.1), transparent 80%)',
            }}
        >
            <motion.div
                className="w-[400px] h-[400px] rounded-full opacity-30"
                style={{
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                    x: cursorXSpring,
                    y: cursorYSpring,
                    filter: 'blur(40px)',
                }}
            />
        </motion.div>
    );
}

// ============================================================================
// SHIMMER TEXT
// ============================================================================

interface ShimmerTextProps {
    children: string;
    className?: string;
}

export function ShimmerText({ children, className = '' }: ShimmerTextProps) {
    return (
        <span className={`relative inline-block ${className}`}>
            <span className="relative z-10">{children}</span>
            <motion.span
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                animate={{
                    x: ['-100%', '100%'],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                }}
                style={{
                    WebkitMaskImage: 'linear-gradient(to right, transparent, black, transparent)',
                    maskImage: 'linear-gradient(to right, transparent, black, transparent)',
                }}
            />
        </span>
    );
}

// ============================================================================
// MAGNETIC BUTTON
// ============================================================================

interface MagneticButtonProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export function MagneticButton({ children, className = '', onClick }: MagneticButtonProps) {
    const ref = useRef<HTMLButtonElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        x.set((e.clientX - centerX) * 0.3);
        y.set((e.clientY - centerY) * 0.3);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    const springX = useSpring(x, { stiffness: 150, damping: 15 });
    const springY = useSpring(y, { stiffness: 150, damping: 15 });

    return (
        <motion.button
            ref={ref}
            className={`relative overflow-hidden ${className}`}
            style={{ x: springX, y: springY }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            whileTap={{ scale: 0.95 }}
        >
            {/* Animated gradient border */}
            <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="absolute inset-[2px] rounded-2xl bg-zinc-900" />
            <span className="relative z-10 flex items-center gap-2">{children}</span>
        </motion.button>
    );
}

// ============================================================================
// REVEAL ON SCROLL
// ============================================================================

interface RevealProps {
    children: React.ReactNode;
    direction?: 'up' | 'down' | 'left' | 'right';
    delay?: number;
}

export function Reveal({ children, direction = 'up', delay = 0 }: RevealProps) {
    const directions = {
        up: { y: 60 },
        down: { y: -60 },
        left: { x: 60 },
        right: { x: -60 },
    };

    return (
        <motion.div
            initial={{ opacity: 0, ...directions[direction] }}
            whileInView={{ opacity: 1, x: 0, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{
                duration: 0.8,
                delay,
                ease: [0.16, 1, 0.3, 1],
            }}
        >
            {children}
        </motion.div>
    );
}

// ============================================================================
// PULSE RING
// ============================================================================

export function PulseRing({ className = '' }: { className?: string }) {
    return (
        <div className={`relative ${className}`}>
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
                animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.25, 0],
                }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeOut',
                }}
            />
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
                animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.25, 0],
                }}
                transition={{
                    duration: 2,
                    delay: 0.5,
                    repeat: Infinity,
                    ease: 'easeOut',
                }}
            />
            <motion.div
                className="absolute inset-0 rounded-full border-2 border-emerald-500/50"
                animate={{
                    scale: [1, 1.5, 2],
                    opacity: [0.5, 0.25, 0],
                }}
                transition={{
                    duration: 2,
                    delay: 1,
                    repeat: Infinity,
                    ease: 'easeOut',
                }}
            />
        </div>
    );
}

// ============================================================================
// SPARKLE EFFECT
// ============================================================================

interface Sparkle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
}

export function SparkleEffect({ count = 20 }: { count?: number }) {
    const [sparkles, setSparkles] = useState<Sparkle[]>([]);

    useEffect(() => {
        const newSparkles = Array.from({ length: count }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 4 + 2,
            delay: Math.random() * 2,
        }));
        setSparkles(newSparkles);
    }, [count]);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {sparkles.map((sparkle) => (
                <motion.div
                    key={sparkle.id}
                    className="absolute rounded-full bg-white"
                    style={{
                        left: `${sparkle.x}%`,
                        top: `${sparkle.y}%`,
                        width: sparkle.size,
                        height: sparkle.size,
                    }}
                    animate={{
                        opacity: [0, 1, 0],
                        scale: [0, 1, 0],
                    }}
                    transition={{
                        duration: 2,
                        delay: sparkle.delay,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
        </div>
    );
}
