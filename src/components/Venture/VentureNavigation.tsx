import React from 'react';
import { motion } from 'framer-motion';

interface VentureNavigationProps {
    logo: string;
    onScroll: (id: string) => void;
    onJoin: () => void;
}

export const VentureNavigation: React.FC<VentureNavigationProps> = ({ logo, onScroll, onJoin }) => {
    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            className="fixed top-0 w-full z-50 backdrop-blur-3xl bg-zinc-950/50 border-b border-white/5"
        >
            <div className="max-w-7xl mx-auto px-6 lg:px-12 h-24 flex items-center justify-between">
                <div className="flex items-center gap-4 cursor-pointer" onClick={() => onScroll('hero')}>
                    <div className="w-12 h-12 bg-teal-500 rounded-2xl flex items-center justify-center text-zinc-950 font-black text-2xl shadow-xl italic">
                        W
                    </div>
                    <div className="flex flex-col">
                        <span className="font-black text-xl text-white tracking-tighter uppercase italic">{logo}</span>
                        <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Venture Builder</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-10">
                    {[
                        { label: 'Portfolio', id: 'portfolio' },
                        { label: 'The Deal', id: 'deal' },
                        { label: 'SEA Market', id: 'market' }
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
                    Apply Recruitment
                </motion.button>
            </div>
        </motion.nav>
    );
};
