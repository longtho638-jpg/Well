import React from 'react';
import { Search, Filter, RefreshCw, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

import { PartnerFilterStatus } from '@/hooks/usePartners';
import { useTranslation } from '@/hooks';

interface PartnerFiltersProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedFilter: PartnerFilterStatus;
    setSelectedFilter: (filter: PartnerFilterStatus) => void;
    loading: boolean;
    onRefresh: () => void;
}

export const PartnerFilters: React.FC<PartnerFiltersProps> = ({
    searchQuery,
    setSearchQuery,
    selectedFilter,
    setSelectedFilter,
    loading,
    onRefresh
}) => {
    const { t } = useTranslation();

    const filterOptions: Array<{ id: string; label: string; value: PartnerFilterStatus }> = [
        { id: 'all', label: t('partnerfilters.filter_all'), value: 'all' },
        { id: 'active', label: t('partnerfilters.filter_active'), value: 'Active' },
        { id: 'banned', label: t('partnerfilters.filter_banned'), value: 'Banned' },
        { id: 'dormant', label: t('partnerfilters.filter_dormant'), value: 'Dormant' },
    ];

    return (
        <div className="flex flex-col lg:flex-row items-center gap-6">
            <div className="relative flex-1 group w-full">
                <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-zinc-500 group-focus-within:text-teal-400 transition-colors">
                    <Search size={18} />
                </div>
                <input
                    type="text"
                    placeholder={t('partnerfilters.search_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-16 pr-6 text-sm font-medium text-white placeholder:text-zinc-600 focus:outline-none focus:border-teal-500/50 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none italic"
                />
            </div>

            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <div className="flex items-center gap-4 px-6 py-4 border border-white/5 rounded-2xl bg-zinc-950 flex-1 lg:flex-none">
                    <Filter className="w-4 h-4 text-zinc-600" />
                    <select
                        value={selectedFilter}
                        onChange={(e) => setSelectedFilter(e.target.value as PartnerFilterStatus)}
                        className="bg-transparent text-[10px] font-black uppercase tracking-[0.2em] focus:outline-none text-zinc-400 italic cursor-pointer w-full"
                    >
                        {filterOptions.map((option) => (
                            <option key={option.id} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                </div>

                <motion.button
                    whileHover={{ scale: 1.05, rotate: 15 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onRefresh}
                    disabled={loading}
                    className="w-14 h-14 bg-zinc-950 border border-white/5 rounded-2xl flex items-center justify-center text-zinc-500 hover:text-teal-400 hover:border-teal-500/30 transition-all shadow-xl disabled:opacity-50"
                >
                    {loading ? <Loader2 size={20} className="animate-spin text-teal-500" /> : <RefreshCw size={20} />}
                </motion.button>
            </div>
        </div>
    );
};
