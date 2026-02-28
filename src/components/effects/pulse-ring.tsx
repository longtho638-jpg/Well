import { motion } from 'framer-motion';

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
