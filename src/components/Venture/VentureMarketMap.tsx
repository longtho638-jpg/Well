import React from 'react';
import { motion } from 'framer-motion';
import { Network, Globe, TrendingUp, ChevronRight } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface VentureMarketMapProps {
    content: {
        sectionBadge: string;
        sectionTitle: string;
        subheadline: string;
        regions: {
            name: string;
            market: string;
            growth: string;
            status: string;
        }[];
    };
    onJoin: () => void;
}

export const VentureMarketMap: React.FC<VentureMarketMapProps> = ({ content, onJoin }) => {
    const { t } = useTranslation();
    return (
        <section id="market" className="relative py-32 bg-zinc-950/20">
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-full px-6 py-2 mb-8">
                        <Network className="w-4 h-4 text-teal-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">
                            {content.sectionBadge}
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 italic tracking-tighter uppercase leading-[0.9]">
                        {content.sectionTitle}
                    </h2>
                    <p className="text-xl text-zinc-500 max-w-3xl mx-auto font-medium">
                        {content.subheadline}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="bg-zinc-900/40 backdrop-blur-3xl relative rounded-[3rem] p-10 lg:p-16 mb-16 border border-white/5 overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 via-transparent to-cyan-500/5" />

                    <div className="relative h-[500px] mb-16 overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl">
                        <img
                            src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=1600&h=900&fit=crop&q=80"
                            alt="SEA Expansion Topology"
                            className="w-full h-full object-cover opacity-20 transition-transform duration-[20000ms] hover:scale-125"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/80" />

                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="relative w-full max-w-4xl h-full flex items-center justify-center">
                                <svg className="absolute inset-0 w-full h-full opacity-20">
                                    <motion.line
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        x1="30%" y1="40%" x2="50%" y2="55%" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="5,10"
                                    />
                                    <motion.line
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        x1="50%" y1="55%" x2="70%" y2="45%" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="5,10"
                                    />
                                    <motion.line
                                        initial={{ pathLength: 0 }}
                                        whileInView={{ pathLength: 1 }}
                                        x1="50%" y1="55%" x2="65%" y2="75%" stroke="#2dd4bf" strokeWidth="2" strokeDasharray="5,10"
                                    />
                                </svg>

                                <Node x="30%" y="40%" delay={0} glow />
                                <Node x="50%" y="55%" delay={0.2} large active />
                                <Node x="70%" y="45%" delay={0.4} />
                                <Node x="65%" y="75%" delay={0.6} />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {content.regions.map((region, idx) => (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-zinc-950 p-8 rounded-[2rem] border border-white/5 hover:border-teal-500/30 transition-all group"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <span className="text-xl font-black text-white italic tracking-tighter uppercase font-display">
                                        {region.name}
                                    </span>
                                    <span className={`text-[8px] font-black px-3 py-1 rounded-full border tracking-widest uppercase ${region.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                        region.status === 'Expanding' ? 'bg-teal-500/10 text-teal-400 border-teal-500/20' :
                                            'bg-zinc-800 text-zinc-500 border-white/5'
                                        }`}>
                                        {region.status}
                                    </span>
                                </div>

                                <div className="mb-6">
                                    <div className="text-4xl font-black text-white italic tracking-tighter group-hover:text-teal-400 transition-colors">
                                        {region.market}
                                    </div>
                                    <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest italic mt-1">{t('venturemarketmap.total_addressable_market')}</div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-4 h-4 text-emerald-400" />
                                    <span className="text-emerald-400 font-black text-xs font-mono">
                                        {region.growth}
                                    </span>
                                    <span className="text-zinc-600 text-[9px] font-black uppercase tracking-widest italic">{t('venturemarketmap.velocity')}</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center"
                >
                    <motion.button
                        onClick={onJoin}
                        className="group bg-transparent border-2 border-teal-500 text-teal-400 px-14 py-6 rounded-2xl font-black text-lg uppercase tracking-widest flex items-center justify-center gap-6 mx-auto hover:bg-teal-500 hover:text-zinc-950 transition-all shadow-[0_0_30px_rgba(20,184,166,0.1)]"
                        whileHover={{ scale: 1.05, boxShadow: '0 0 50px rgba(20,184,166,0.3)' }}
                        whileTap={{ scale: 0.98 }}
                    >
                        <Globe className="w-6 h-6" />
                        {t('venturemarketmap.init_sea_expansion_protocol')}<ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                </motion.div>
            </div>
        </section>
    );
};

const Node = ({ x, y, delay, large, active, glow }: { x: string; y: string; delay: number; large?: boolean; active?: boolean; glow?: boolean }) => (
    <motion.div
        initial={{ scale: 0, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        transition={{ delay, duration: 0.8, type: 'spring' }}
        style={{ left: x, top: y }}
        className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full border ${active ? 'bg-teal-500 border-white shadow-[0_0_40px_rgba(20,184,166,1)]' : 'bg-zinc-800 border-white/20'} 
            ${large ? 'w-8 h-8' : 'w-4 h-4'} 
            ${glow ? 'shadow-[0_0_20px_rgba(255,191,0,0.5)]' : ''}`}
    >
        {active && <span className="absolute inset-0 rounded-full animate-ping bg-teal-500 opacity-50" />}
    </motion.div>
);
