import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, ArrowRight, Globe } from 'lucide-react';

interface VentureHeroProps {
    content: {
        badge: string;
        headline: string;
        headlineAccent: string;
        subheadline: string;
        primaryCta: string;
        secondaryCta: string;
        stats: { value: string; label: string }[];
    };
    onJoin: () => void;
    onPortfolio: () => void;
}

export const VentureHero: React.FC<VentureHeroProps> = ({ content, onJoin, onPortfolio }) => {
    const cinematicFadeIn = {
        hidden: { opacity: 0, y: 60, scale: 0.95 },
        visible: {
            opacity: 1,
            y: 0,
            scale: 1,
            transition: {
                duration: 1,
                ease: [0.16, 1, 0.3, 1]
            }
        }
    };

    const staggerContainer = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
                delayChildren: 0.3
            }
        }
    };

    return (
        <section id="hero" className="relative min-h-[90vh] pt-32 pb-20 overflow-hidden flex items-center">
            {/* Glowing Orbs */}
            <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-[150px] animate-float opacity-50" />
            <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] opacity-30" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="text-center max-w-5xl mx-auto"
                >
                    <motion.div variants={cinematicFadeIn} className="mb-10 inline-flex">
                        <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-3xl border border-white/10 rounded-full px-6 py-3">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-500 opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
                            </span>
                            <Globe className="w-4 h-4 text-teal-400" />
                            <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                                {content.badge}
                            </span>
                        </div>
                    </motion.div>

                    <motion.h1
                        variants={cinematicFadeIn}
                        className="text-6xl md:text-8xl font-black text-white italic tracking-tighter leading-[0.9] mb-10"
                    >
                        {content.headline}
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-400 via-cyan-400 to-teal-400 drop-shadow-[0_0_30px_rgba(45,212,191,0.3)]">
                            {content.headlineAccent}
                        </span>
                    </motion.h1>

                    <motion.p
                        variants={cinematicFadeIn}
                        className="text-xl md:text-2xl text-zinc-500 mb-16 max-w-4xl mx-auto font-medium"
                    >
                        {content.subheadline}
                    </motion.p>

                    <motion.div
                        variants={cinematicFadeIn}
                        className="flex flex-col sm:flex-row gap-6 justify-center mb-24"
                    >
                        <motion.button
                            onClick={onJoin}
                            className="group bg-teal-500 text-zinc-950 px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-4 shadow-[0_0_40px_rgba(20,184,166,0.4)]"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Rocket className="w-5 h-5" />
                            {content.primaryCta}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button
                            onClick={onPortfolio}
                            className="px-12 py-6 rounded-2xl font-black text-sm uppercase tracking-widest text-white border border-white/10 bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all hover:border-teal-500/50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {content.secondaryCta}
                        </motion.button>
                    </motion.div>

                    <motion.div
                        variants={cinematicFadeIn}
                        className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto"
                    >
                        {content.stats.map((stat, idx) => (
                            <div key={idx} className="bg-zinc-900/50 border border-white/5 p-8 rounded-[2.5rem] hover:border-teal-500/30 transition-all group">
                                <div className="text-5xl font-black text-white italic tracking-tighter mb-2 group-hover:text-teal-400 transition-colors">
                                    {stat.value}
                                </div>
                                <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest italic">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
};
