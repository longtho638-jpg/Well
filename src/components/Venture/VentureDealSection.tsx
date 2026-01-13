import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle2 } from 'lucide-react';

interface VentureDealSectionProps {
    content: {
        sectionBadge: string;
        sectionTitle: string;
        subheadline: string;
        terms: {
            category: string;
            items: string[];
            icon: React.ElementType;
            gradient: string;
        }[];
    };
}

export const VentureDealSection: React.FC<VentureDealSectionProps> = ({ content }) => {
    return (
        <section id="deal" className="relative py-32 bg-zinc-950/40">
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-full px-6 py-2 mb-8">
                        <Lock className="w-4 h-4 text-teal-400" />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">
                            {content.sectionBadge}
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black text-white mb-8 italic tracking-tighter uppercase">
                        {content.sectionTitle}
                    </h2>
                    <p className="text-xl text-zinc-500 max-w-3xl mx-auto font-medium lead-relaxed">
                        {content.subheadline}
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-3 gap-10">
                    {content.terms.map((term, idx) => {
                        const Icon = term.icon;
                        return (
                            <motion.div
                                key={idx}
                                initial={{ opacity: 0, y: 60 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: idx * 0.2 }}
                                className="group relative"
                            >
                                <div className="absolute -inset-1 bg-gradient-to-br from-teal-500/20 to-cyan-500/20 rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                                <div className="bg-zinc-900/50 backdrop-blur-3xl relative rounded-[3rem] p-10 h-full border border-white/5 group-hover:border-teal-500/30 transition-all overflow-hidden">
                                    <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${term.gradient} blur-3xl opacity-20`} />

                                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-white/10 flex items-center justify-center mb-10 group-hover:scale-110 group-hover:rotate-6 transition-all shadow-2xl relative z-10">
                                        <Icon className="w-8 h-8 text-teal-400" />
                                    </div>

                                    <h3 className="text-2xl font-black text-white mb-8 italic tracking-tighter uppercase relative z-10">
                                        {term.category}
                                    </h3>

                                    <ul className="space-y-5 relative z-10">
                                        {term.items.map((item, itemIdx) => (
                                            <li key={itemIdx} className="flex items-start gap-4">
                                                <CheckCircle2 className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" />
                                                <span className="text-zinc-400 text-[11px] font-bold uppercase tracking-widest leading-relaxed">
                                                    {item}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};
