/**
 * Ultimate WOW Effects - Phase 20
 * Top-tier visual enhancements for $1M homepage
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { isSafari } from '@/utils/browser-detect';

// ============================================================================
// 3D TILT CARD
// ============================================================================

interface TiltCardProps {
    children: React.ReactNode;
    className?: string;
    intensity?: number;
}

export function TiltCard({ children, className = '', intensity = 15 }: TiltCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);

    const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [intensity, -intensity]), {
        stiffness: 300,
        damping: 30,
    });
    const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-intensity, intensity]), {
        stiffness: 300,
        damping: 30,
    });

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const xVal = (e.clientX - rect.left) / rect.width - 0.5;
        const yVal = (e.clientY - rect.top) / rect.height - 0.5;
        x.set(xVal);
        y.set(yVal);
    };

    const handleMouseLeave = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.div
            ref={ref}
            className={`relative ${className}`}
            style={{
                rotateX,
                rotateY,
                transformStyle: 'preserve-3d',
                perspective: 1000,
            }}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            {children}
            {/* Shine effect */}
            <motion.div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                    background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, transparent 100%)',
                    opacity: useTransform(x, [-0.5, 0, 0.5], [0, 0.3, 0]),
                }}
            />
        </motion.div>
    );
}

// ============================================================================
// TYPEWRITER TEXT
// ============================================================================

interface TypewriterProps {
    texts: string[];
    speed?: number;
    pauseTime?: number;
    className?: string;
}

export function Typewriter({ texts, speed = 50, pauseTime = 2000, className = '' }: TypewriterProps) {
    const [displayText, setDisplayText] = useState('');
    const [textIndex, setTextIndex] = useState(0);
    const [charIndex, setCharIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const currentText = texts[textIndex];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                if (charIndex < currentText.length) {
                    setDisplayText(currentText.slice(0, charIndex + 1));
                    setCharIndex(charIndex + 1);
                } else {
                    setTimeout(() => setIsDeleting(true), pauseTime);
                }
            } else {
                if (charIndex > 0) {
                    setDisplayText(currentText.slice(0, charIndex - 1));
                    setCharIndex(charIndex - 1);
                } else {
                    setIsDeleting(false);
                    setTextIndex((textIndex + 1) % texts.length);
                }
            }
        }, isDeleting ? speed / 2 : speed);

        return () => clearTimeout(timeout);
    }, [charIndex, isDeleting, textIndex, texts, speed, pauseTime]);

    return (
        <span className={className}>
            {displayText}
            <motion.span
                animate={{ opacity: [1, 0] }}
                transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                className="inline-block w-[3px] h-[1em] bg-current ml-1"
            />
        </span>
    );
}

// ============================================================================
// GRADIENT TEXT ANIMATION
// ============================================================================

interface GradientTextProps {
    children: string;
    className?: string;
    colors?: string[];
}

export function GradientText({
    children,
    className = '',
    colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#10b981']
}: GradientTextProps) {
    return (
        <motion.span
            className={`inline-block bg-clip-text text-transparent ${className}`}
            style={{
                backgroundImage: `linear-gradient(90deg, ${colors.join(', ')})`,
                backgroundSize: '200% 100%',
            }}
            animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
                duration: 5,
                repeat: Infinity,
                ease: 'linear',
            }}
        >
            {children}
        </motion.span>
    );
}

// ============================================================================
// PARALLAX SECTION
// ============================================================================

interface ParallaxProps {
    children: React.ReactNode;
    speed?: number;
    className?: string;
}

export function Parallax({ children, speed = 0.5, className = '' }: ParallaxProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [offset, setOffset] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (!ref.current) return;
            const rect = ref.current.getBoundingClientRect();
            const scrollY = window.scrollY;
            const elementTop = rect.top + scrollY;
            const relativeScroll = scrollY - elementTop;
            setOffset(relativeScroll * speed);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [speed]);

    return (
        <div ref={ref} className={`relative overflow-hidden ${className}`}>
            <motion.div style={{ y: offset }}>
                {children}
            </motion.div>
        </div>
    );
}

// ============================================================================
// NUMBER COUNTER WITH SCROLL TRIGGER
// ============================================================================

interface ScrollCounterProps {
    end: number;
    prefix?: string;
    suffix?: string;
    className?: string;
}

export function ScrollCounter({ end, prefix = '', suffix = '', className = '' }: ScrollCounterProps) {
    const ref = useRef<HTMLSpanElement>(null);
    const [count, setCount] = useState(0);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated) {
                    setHasAnimated(true);
                    const duration = 2000;
                    const steps = 60;
                    const increment = end / steps;
                    let current = 0;

                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= end) {
                            setCount(end);
                            clearInterval(timer);
                        } else {
                            setCount(Math.floor(current));
                        }
                    }, duration / steps);
                }
            },
            { threshold: 0.5 }
        );

        if (ref.current) observer.observe(ref.current);
        return () => observer.disconnect();
    }, [end, hasAnimated]);

    const formatNumber = (n: number) => {
        if (n >= 1000000000) return (n / 1000000000).toFixed(1) + 'B';
        if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
        if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
        return n.toLocaleString('vi-VN');
    };

    return (
        <span ref={ref} className={className}>
            {prefix}{formatNumber(count)}{suffix}
        </span>
    );
}

// ============================================================================
// MORPHING BLOB
// ============================================================================

export function MorphingBlob({ className = '' }: { className?: string }) {
    // Safari: render static blob without blur animation to prevent GPU compositor crash
    if (isSafari()) {
        return (
            <div className={`absolute rounded-full opacity-20 ${className}`} />
        );
    }

    return (
        <motion.div
            className={`absolute rounded-full blur-3xl opacity-30 ${className}`}
            animate={{
                borderRadius: [
                    '60% 40% 30% 70%/60% 30% 70% 40%',
                    '30% 60% 70% 40%/50% 60% 30% 60%',
                    '60% 40% 30% 70%/60% 30% 70% 40%',
                ],
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
            }}
            transition={{
                duration: 20,
                repeat: Infinity,
                ease: 'easeInOut',
            }}
        />
    );
}

// ============================================================================
// HOVER CARD WITH SPOTLIGHT
// ============================================================================

interface SpotlightCardProps {
    children: React.ReactNode;
    className?: string;
}

export function SpotlightCard({ children, className = '' }: SpotlightCardProps) {
    const ref = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isHovered, setIsHovered] = useState(false);

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        setPosition({
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        });
    };

    return (
        <motion.div
            ref={ref}
            className={`relative overflow-hidden bg-zinc-900/50 border border-zinc-800 rounded-3xl ${className}`}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.02 }}
        >
            {/* Spotlight effect */}
            <motion.div
                className="absolute pointer-events-none"
                style={{
                    width: 400,
                    height: 400,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 70%)',
                    left: position.x - 200,
                    top: position.y - 200,
                }}
                animate={{
                    opacity: isHovered ? 1 : 0,
                }}
                transition={{ duration: 0.3 }}
            />
            <div className="relative z-10">{children}</div>
        </motion.div>
    );
}

// ============================================================================
// STAGGERED LIST
// ============================================================================

interface StaggeredListProps {
    children: React.ReactNode[];
    className?: string;
    staggerDelay?: number;
}

export function StaggeredList({ children, className = '', staggerDelay = 0.1 }: StaggeredListProps) {
    return (
        <div className={className}>
            {children.map((child, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{
                        delay: index * staggerDelay,
                        duration: 0.5,
                        ease: [0.16, 1, 0.3, 1],
                    }}
                >
                    {child}
                </motion.div>
            ))}
        </div>
    );
}

// ============================================================================
// ANIMATED BORDER
// ============================================================================

interface AnimatedBorderProps {
    children: React.ReactNode;
    className?: string;
}

export function AnimatedBorder({ children, className = '' }: AnimatedBorderProps) {
    return (
        <div className={`relative p-[2px] rounded-3xl overflow-hidden ${className}`}>
            {/* Animated gradient border */}
            <motion.div
                className="absolute inset-0"
                style={{
                    background: 'conic-gradient(from 0deg, #10b981, #06b6d4, #8b5cf6, #ec4899, #10b981)',
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
            />
            <div className="relative bg-zinc-900 rounded-3xl">{children}</div>
        </div>
    );
}

// ============================================================================
// MARQUEE
// ============================================================================

interface MarqueeProps {
    children: React.ReactNode;
    speed?: number;
    direction?: 'left' | 'right';
    className?: string;
}

export function Marquee({ children, speed = 20, direction = 'left', className = '' }: MarqueeProps) {
    return (
        <div className={`overflow-hidden ${className}`}>
            <motion.div
                className="flex gap-8 whitespace-nowrap"
                animate={{
                    x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
                }}
                transition={{
                    duration: speed,
                    repeat: Infinity,
                    ease: 'linear',
                }}
            >
                {children}
                {children}
            </motion.div>
        </div>
    );
}
