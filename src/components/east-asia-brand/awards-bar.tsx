// Awards and certifications horizontal bar with scroll animation
import { motion } from 'framer-motion';

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
