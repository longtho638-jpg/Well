/**
 * ProductTabs - Tabbed content for product details
 * Displays Benefits, Ingredients, and Usage in an animated tab interface.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Leaf, Clock } from 'lucide-react';
import { ProductDetailTab } from '@/hooks/useProductDetail';
import { ProductDetails } from '@/data/productDetails';
import { useTranslation } from '@/hooks';

interface Props {
    activeTab: ProductDetailTab;
    setActiveTab: (tab: ProductDetailTab) => void;
    details: ProductDetails;
}

export const ProductTabs: React.FC<Props> = ({ activeTab, setActiveTab, details }) => {
    const { t } = useTranslation();

    const TABS = [
        { id: 'benefits' as const, label: t('producttabs.primary_yield'), icon: Zap },
        { id: 'ingredients' as const, label: t('producttabs.composition'), icon: Leaf },
        { id: 'usage' as const, label: t('producttabs.protocol'), icon: Clock },
    ];

    return (
        <div className="border-t border-white/5">
            <div className="flex border-b border-white/5">
                {TABS.map((tab) => {
                    const Icon = tab.icon;
                    const active = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 py-10 flex flex-col items-center justify-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative italic
                                ${active
                                    ? 'text-white bg-zinc-900/50 shadow-inner'
                                    : 'text-zinc-600 hover:text-zinc-400'
                                }`}
                        >
                            <Icon className={`w-5 h-5 transition-transform duration-500 ${active ? 'text-teal-400 scale-125' : ''}`} />
                            {tab.label}
                            {active && (
                                <motion.div
                                    layoutId="tab-indicator"
                                    className="absolute bottom-0 inset-x-0 h-1 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <div className="p-16 lg:p-24 bg-zinc-900/20 backdrop-blur-sm min-h-[400px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.5, ease: "circOut" }}
                    >
                        {activeTab === 'ingredients' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {details.ingredients.map((ing, i) => (
                                    <div key={i} className="flex items-center gap-6 bg-zinc-950 p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all group/ing shadow-lg">
                                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 group-hover/ing:scale-110 transition-transform">
                                            <Leaf className="w-5 h-5" />
                                        </div>
                                        <span className="font-black text-white text-xs uppercase tracking-widest italic">{ing}</span>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'benefits' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                {details.benefits.map((ben, i) => (
                                    <div key={i} className="space-y-6 group/ben">
                                        <div className="w-14 h-14 bg-teal-500/10 rounded-2xl flex items-center justify-center text-teal-400 border border-teal-500/20 mb-8 group-hover/ben:rotate-12 transition-transform">
                                            <Zap className="w-7 h-7" />
                                        </div>
                                        <h4 className="text-2xl font-black text-white leading-tight italic uppercase tracking-tighter">{ben.title}</h4>
                                        <p className="text-zinc-500 font-bold leading-relaxed text-sm">{ben.desc}</p>
                                    </div>
                                ))}
                            </div>
                        )}

                        {activeTab === 'usage' && (
                            <div className="max-w-3xl mx-auto text-center space-y-12 py-10">
                                <div className="relative inline-block">
                                    <div className="absolute inset-0 bg-indigo-500/20 blur-[50px] animate-pulse" />
                                    <div className="w-24 h-24 bg-zinc-950 rounded-[2.5rem] flex items-center justify-center text-indigo-400 mx-auto border border-white/5 relative z-10 shadow-2xl">
                                        <Clock size={48} />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] italic">{t('producttabs.standard_engagement_protocol')}</h4>
                                    <p className="text-3xl text-white font-black leading-tight italic tracking-tighter drop-shadow-lg">
                                        "{details.usage}"
                                    </p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};
