/**
 * Trust badges bar — partner/certification logos
 */

import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

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

export const TRUST_BADGES = [
    { name: 'VNPay' },
    { name: 'Momo' },
    { name: 'Google Cloud' },
    { name: 'Firebase' },
    { name: 'Stripe' },
];
