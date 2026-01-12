/**
 * VenturePage Hero Section
 * Extracted from VenturePage.tsx
 */

import { motion, Variants } from 'framer-motion';
import { Globe, Rocket, ArrowRight } from 'lucide-react';

interface HeroSectionProps {
    content: {
        badge: string;
        headline: string;
        headlineAccent: string;
        subheadline: string;
        primaryCta: string;
        secondaryCta: string;
        stats: Array<{ value: string; label: string }>;
    };
    onJoin: () => void;
    onScrollTo: (id: string) => void;
    staggerContainer: Variants;
    cinematicFadeIn: Variants;
}

export function HeroSection({ content, onJoin, onScrollTo, staggerContainer, cinematicFadeIn }: HeroSectionProps) {
    return (
        <section id="hero" className="relative min-h-screen pt-32 pb-20 overflow-hidden flex items-center">
            {/* Glowing Orbs */}
            <div className="absolute top-20 right-20 w-[500px] h-[500px] bg-[#FFBF00]/20 rounded-full blur-[150px] animate-float" />
            <div className="absolute bottom-20 left-20 w-[400px] h-[400px] bg-[#00575A]/30 rounded-full blur-[120px]" style={{ animationDelay: '1s' }} />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 w-full">
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="text-center max-w-5xl mx-auto"
                >
                    {/* Badge */}
                    <motion.div variants={cinematicFadeIn} className="mb-8 inline-flex">
                        <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2.5">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FFBF00] opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#FFBF00]" />
                            </span>
                            <Globe className="w-4 h-4 text-[#FFBF00]" />
                            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                                {content.badge}
                            </span>
                        </div>
                    </motion.div>

                    {/* Headline */}
                    <motion.h1
                        variants={cinematicFadeIn}
                        className="font-display font-black text-6xl md:text-7xl lg:text-8xl mb-8 leading-[0.9] tracking-tight"
                    >
                        <span className="text-slate-100">{content.headline}</span>
                        <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FFBF00] via-[#FFD700] to-[#FFBF00] glow-text">
                            {content.headlineAccent}
                        </span>
                    </motion.h1>

                    {/* Subheadline */}
                    <motion.p
                        variants={cinematicFadeIn}
                        className="text-xl md:text-2xl text-slate-400 mb-12 leading-relaxed max-w-4xl mx-auto"
                    >
                        {content.subheadline}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div variants={cinematicFadeIn} className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
                        <motion.button
                            onClick={onJoin}
                            className="group bg-[#FFBF00] text-slate-950 px-10 py-5 rounded-xl font-bold text-lg flex items-center justify-center gap-3 shadow-2xl shadow-[#FFBF00]/30"
                            whileHover={{ scale: 1.05, boxShadow: '0 30px 60px rgba(255, 191, 0, 0.4)' }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Rocket className="w-5 h-5" />
                            {content.primaryCta}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <motion.button
                            onClick={() => onScrollTo('portfolio')}
                            className="px-10 py-5 rounded-xl font-bold text-lg text-slate-300 border-2 border-white/10 hover:border-[#FFBF00] bg-white/5 backdrop-blur-xl hover:bg-white/10 transition-all"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {content.secondaryCta}
                        </motion.button>
                    </motion.div>

                    {/* Stats */}
                    <motion.div variants={cinematicFadeIn} className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
                        {content.stats.map((stat, idx) => (
                            <div key={idx} className="relative group">
                                <div className="absolute inset-0 bg-gradient-to-br from-[#FFBF00]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity blur-xl" />
                                <div className="glass-ultra relative rounded-2xl p-6 hover:border-[#FFBF00]/50 transition-all">
                                    <div className="text-4xl lg:text-5xl font-black text-[#FFBF00] font-display mb-2">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-slate-400 font-medium">
                                        {stat.label}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
