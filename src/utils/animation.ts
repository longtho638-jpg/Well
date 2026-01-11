/**
 * Animation Utilities
 * Phase 12: Time and Animation
 */

import { CSSProperties } from 'react';

// ============================================================================
// ANIMATION PRESETS
// ============================================================================

export const animations = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    },
    fadeInUp: {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: 20 },
    },
    fadeInDown: {
        initial: { opacity: 0, y: -20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
    },
    slideInLeft: {
        initial: { opacity: 0, x: -50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -50 },
    },
    slideInRight: {
        initial: { opacity: 0, x: 50 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: 50 },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.9 },
    },
    bounce: {
        initial: { opacity: 0, scale: 0.3 },
        animate: {
            opacity: 1,
            scale: 1,
            transition: { type: 'spring', stiffness: 300, damping: 20 }
        },
        exit: { opacity: 0, scale: 0.3 },
    },
} as const;

export type AnimationName = keyof typeof animations;

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

export const transitions = {
    fast: { duration: 0.15 },
    normal: { duration: 0.3 },
    slow: { duration: 0.5 },
    spring: { type: 'spring', stiffness: 300, damping: 30 },
    easeOut: { duration: 0.3, ease: 'easeOut' },
    easeInOut: { duration: 0.3, ease: 'easeInOut' },
} as const;

export type TransitionName = keyof typeof transitions;

// ============================================================================
// STAGGER CHILDREN
// ============================================================================

export function staggerContainer(staggerDuration = 0.1) {
    return {
        initial: 'hidden',
        animate: 'visible',
        variants: {
            hidden: { opacity: 0 },
            visible: {
                opacity: 1,
                transition: {
                    staggerChildren: staggerDuration,
                },
            },
        },
    };
}

export function staggerItem(animation: AnimationName = 'fadeInUp') {
    return {
        variants: {
            hidden: animations[animation].initial,
            visible: animations[animation].animate,
        },
    };
}

// ============================================================================
// CSS ANIMATION HELPERS
// ============================================================================

export function animationDelay(index: number, baseDelay = 0.1): CSSProperties {
    return { animationDelay: `${index * baseDelay}s` };
}

export function transitionDelay(index: number, baseDelay = 0.1): CSSProperties {
    return { transitionDelay: `${index * baseDelay}s` };
}

// ============================================================================
// KEYFRAME GENERATORS
// ============================================================================

export function pulseKeyframes(scale = 1.05): string {
    return `
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(${scale}); }
    }
  `;
}

export function shakeKeyframes(distance = 10): string {
    return `
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-${distance}px); }
      75% { transform: translateX(${distance}px); }
    }
  `;
}

// ============================================================================
// SCROLL ANIMATIONS
// ============================================================================

export function getScrollProgress(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Element is above viewport
    if (rect.bottom < 0) return 1;
    // Element is below viewport
    if (rect.top > windowHeight) return 0;

    // Calculate progress
    const totalDistance = windowHeight + rect.height;
    const distanceTraveled = windowHeight - rect.top;

    return Math.min(1, Math.max(0, distanceTraveled / totalDistance));
}

// ============================================================================
// ANIMATION STATE HOOK
// ============================================================================

import { useState, useEffect } from 'react';

export function useAnimationState(delay = 0): boolean {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    return isVisible;
}

export function useEnterAnimation(delay = 0) {
    const isVisible = useAnimationState(delay);

    return {
        style: {
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.3s ease-out, transform 0.3s ease-out',
        } as CSSProperties,
        isVisible,
    };
}
