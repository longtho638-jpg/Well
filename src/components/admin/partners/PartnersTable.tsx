import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Users, Ghost } from 'lucide-react';
import { PartnerRow } from './PartnerRow';
import { Partner } from '@/hooks/usePartners';
import { useTranslation } from '@/hooks';

interface PartnersTableProps {
    partners: Partner[];
    loading: boolean;
    selectedIds: Set<string>;
    onToggleSelect: (id: string) => void;
    onToggleSelectAll: () => void;
    onView: (partner: Partner) => void;
}

export const PartnersTable: React.FC<PartnersTableProps> = ({
    partners,
    loading,
    selectedIds,
    onToggleSelect,
    onToggleSelectAll,
    onView
}) => {
    const { t } = useTranslation();
    const isAllSelected = selectedIds.size === partners.length && partners.length > 0;

    return (
        <div className="bg-zinc-950/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead className="bg-zinc-900/50 border-b border-white/5">
                        <tr>
                            <th className="px-6 py-6 w-16">
                                <button
                                    onClick={onToggleSelectAll}
                                    className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-500 ${isAllSelected
                                        ? 'bg-teal-500 border-teal-400 shadow-[0_0_15px_rgba(20,184,166,0.4)]'
                                        : 'border-white/10 hover:border-teal-500/50'
                                        }`}
                                >
                                    {isAllSelected && <Check className="w-4 h-4 text-white" />}
                                </button>
                            </th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">{t('partnerstable.identity_node')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">{t('partnerstable.ecosystem_rank')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">{t('partnerstable.direct_yield')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">{t('partnerstable.auth_pending')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">{t('partnerstable.points_buffer')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">{t('partnerstable.auth_status')}</th>
                            <th className="px-6 py-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] italic">{t('partnerstable.ops')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-32 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-4">
                                        <Loader2 className="w-12 h-12 animate-spin text-teal-500" />
                                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] animate-pulse">{t('partnerstable.synchronizing_crm_ledger')}</p>
                                    </div>
                                </td>
                            </tr>
                        ) : partners.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-6 py-32 text-center">
                                    <div className="flex flex-col items-center justify-center space-y-6 opacity-30">
                                        <Ghost className="w-16 h-16 text-zinc-500" />
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">{t('partnerstable.ghost_network_detected')}</h3>
                                            <p className="text-xs font-medium text-zinc-500">{t('partnerstable.no_partner_nodes_matching_curr')}</p>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {partners.map((partner) => (
                                    <PartnerRow
                                        key={partner.id}
                                        partner={partner}
                                        isSelected={selectedIds.has(partner.id)}
                                        onToggle={onToggleSelect}
                                        onView={onView}
                                    />
                                ))}
                            </AnimatePresence>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
