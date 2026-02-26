import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

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
