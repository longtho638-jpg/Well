/**
 * VenturePage Portfolio Section
 * Extracted from VenturePage.tsx
 */

import { motion } from 'framer-motion';
import { Award, MapPin } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Company {
    founderName: string;
    companyName: string;
    role: string;
    valuation: string;
    growth: string;
    metric: string;
    image: string;
    region: string;
}

interface PortfolioSectionProps {
    content: {
        sectionBadge: string;
        sectionTitle: string;
        subheadline: string;
        companies: Company[];
    };
}

export function PortfolioSection({ content }: PortfolioSectionProps) {
    const { t } = useTranslation();
    return (
        <section id="portfolio" className="relative py-32 bg-black/40">
            <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12">
                {/* Section Header */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center mb-20"
                >
                    <div className="inline-flex items-center gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-full px-5 py-2 mb-6">
                        <Award className="w-4 h-4 text-[#FFBF00]" />
                        <span className="text-sm font-bold text-slate-300 uppercase tracking-wider">
                            {content.sectionBadge}
                        </span>
                    </div>
                    <h2 className="text-5xl md:text-6xl lg:text-7xl font-black text-white mb-6 font-display">
                        {content.sectionTitle}
                    </h2>
                    <p className="text-xl text-slate-400 max-w-3xl mx-auto">
                        {content.subheadline}
                    </p>
                </motion.div>

                {/* Portfolio Grid */}
                <div className="grid md:grid-cols-3 gap-8">
                    {content.companies.map((company, idx) => (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.15, duration: 0.8 }}
                            className="group relative"
                        >
                            {/* Glow */}
                            <div className="absolute -inset-0.5 bg-gradient-to-br from-[#FFBF00]/30 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />

                            {/* Card */}
                            <div className="glass-ultra relative rounded-3xl overflow-hidden hover:border-[#FFBF00]/30 transition-all">
                                {/* Profile Image */}
                                <div className="relative h-64 overflow-hidden">
                                    <img
                                        src={company.image}
                                        alt={company.founderName}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />

                                    {/* Valuation Badge */}
                                    <div className="absolute top-4 right-4">
                                        <div className="bg-[#FFBF00]/20 backdrop-blur-xl border border-[#FFBF00]/30 rounded-full px-4 py-2">
                                            <span className="text-[#FFBF00] font-bold text-sm">
                                                {company.valuation}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Region */}
                                    <div className="absolute bottom-4 left-4">
                                        <div className="flex items-center gap-2 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-3 py-1.5">
                                            <MapPin className="w-3 h-3 text-slate-400" />
                                            <span className="text-slate-300 font-medium text-xs">
                                                {company.region}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    <h3 className="text-2xl font-bold text-white mb-1 font-display">
                                        {company.founderName}
                                    </h3>
                                    <p className="text-slate-400 text-sm mb-1">{company.role}</p>
                                    <p className="text-[#FFBF00] text-sm font-bold mb-4">
                                        {company.companyName}
                                    </p>

                                    {/* Metrics */}
                                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                        <div>
                                            <div className="text-sm text-slate-500">{t('portfoliosection.growth')}</div>
                                            <div className="text-lg font-bold text-emerald-400">
                                                {company.growth}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-slate-500">{t('portfoliosection.arr')}</div>
                                            <div className="text-lg font-bold text-white">
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
}
