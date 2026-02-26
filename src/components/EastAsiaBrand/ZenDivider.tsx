import { motion } from 'framer-motion';

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
