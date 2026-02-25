import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

interface VentureNavigationProps {
    logo: string;
    onScroll: (id: string) => void;
    onJoin: () => void;
}

export const VentureNavigation: React.FC<VentureNavigationProps> = ({ logo, onScroll, onJoin }) => {
    const { t } = useTranslation();
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 w-full z-50 backdrop-blur-3xl bg-zinc-950/50 border-b border-white/5"
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
                <button
                    onClick={() => onScroll('hero')}
                    className="flex items-center gap-4 cursor-pointer bg-transparent border-0 p-0"
                    aria-label="Scroll to top"
                >
                    <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-zinc-950 font-black text-2xl shadow-xl italic">
                        W
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xl text-white tracking-tighter uppercase italic">{logo}</span>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">{t('venture.navigation.venture_builder')}</span>
                    </div>
                </button>

                <div className="hidden md:flex items-center gap-10">
                    {[
                        { label: t('venture.navigation.menu.portfolio'), id: 'portfolio' },
                        { label: t('venture.navigation.menu.deal'), id: 'deal' },
                        { label: t('venture.navigation.menu.market'), id: 'market' }
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => onScroll(item.id)}
                            className="text-[10px] font-black text-zinc-500 hover:text-white transition-colors uppercase tracking-[0.2em] italic"
                        >
                            {item.label}
                        </button>
                    ))}
                </div>

                <motion.button
                    onClick={onJoin}
                    className="bg-white text-zinc-950 px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest italic shadow-2xl transition-all hover:scale-105 active:scale-95"
                    whileTap={{ scale: 0.95 }}
                >
                    {t('venture.navigation.apply_recruitment')}</motion.button>
            </div>
        </motion.nav>
    );
};
