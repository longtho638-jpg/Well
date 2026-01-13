import React from 'react';
import { motion } from 'framer-motion';
import { Award, MapPin } from 'lucide-react';

interface VenturePortfolioProps {
    content: {
        sectionBadge: string;
        sectionTitle: string;
        subheadline: string;
        companies: {
            founderName: string;
            companyName: string;
            role: string;
            valuation: string;
            growth: string;
            metric: string;
            image: string;
            region: string;
        }[];
    };
}

export const VenturePortfolio: React.FC<VenturePortfolioProps> = ({ content }) => {
    return (
        <section id="portfolio" className="relative py-32 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-teal-950/10 to-transparent" />

            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-center mb-24"
                >
                    <div className="inline-flex items-center gap-4 bg-zinc-900 border border-white/5 rounded-full px-6 py-2 mb-8">
                        <Award className="w-4 h-4 text-teal-400" />
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

                <div className="grid md:grid-cols-3 gap-12">
                    {content.companies.map((company, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15 }}
                            className="group relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-br from-teal-500/30 to-transparent rounded-[3rem] blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
                            <div className="bg-zinc-900/40 backdrop-blur-3xl relative rounded-[3rem] overflow-hidden border border-white/5 group-hover:border-teal-500/30 transition-all">
                                <div className="relative h-80 overflow-hidden">
                                    <img
                                        src={company.image}
                                        alt={company.founderName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent opacity-90" />

                                    <div className="absolute top-6 right-6">
                                        <div className="bg-teal-500/20 backdrop-blur-xl border border-teal-500/40 rounded-full px-5 py-2 shadow-2xl">
                                            <span className="text-teal-400 font-black text-[10px] uppercase tracking-widest">
                                                Val: {company.valuation}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="absolute bottom-6 left-6 flex items-center gap-3">
                                        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-full px-4 py-2 flex items-center gap-2">
                                            <MapPin className="w-3 h-3 text-teal-500" />
                                            <span className="text-zinc-400 font-black text-[9px] uppercase tracking-widest">
                                                {company.region}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div>
                                        <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
                                            {company.founderName}
                                        </h3>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest italic">{company.role}</span>
                                            <div className="w-1 h-1 rounded-full bg-teal-500/40" />
                                            <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest italic">{company.companyName}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/5">
                                        <div>
                                            <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">Growth</div>
                                            <div className="text-xl font-black text-emerald-400 font-mono italic">
                                                {company.growth}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic">ARR Node</div>
                                            <div className="text-xl font-black text-white font-mono italic">
                                                {company.metric}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};
