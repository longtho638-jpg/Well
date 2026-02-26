import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

// ============================================================================
// FLOATING NAV - EAST ASIAN MINIMAL
// ============================================================================

export function FloatingNav() {
    const { t } = useTranslation();
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
                <span className="font-bold text-lg text-white">{t('eastasiabrand.wellnexus')}</span>
                <div className="hidden md:flex items-center gap-6 text-sm text-zinc-400">
                    <a href="#about" className="hover:text-white transition-colors">{t('eastasiabrand.v_ch_ng_t_i')}</a>
                    <a href="#products" className="hover:text-white transition-colors">{t('eastasiabrand.s_n_ph_m')}</a>
                    <a href="#partners" className="hover:text-white transition-colors">{t('eastasiabrand.i_t_c')}</a>
                </div>
                <button className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-xl transition-colors">
                    {t('eastasiabrand.b_t_u')}</button>
            </div>
        </motion.nav>
    );
}
