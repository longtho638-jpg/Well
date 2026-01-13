import React, { useState, memo } from 'react';
import { motion } from 'framer-motion';
import { X, Edit2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { RANK_NAMES } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { adminLogger } from '@/utils/logger';
import { Partner } from '@/hooks/usePartners';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useTranslation } from '@/hooks';

interface PartnerDetailModalProps {
    partner: Partner;
    onClose: () => void;
    onUpdate: (id: string, updates: Partial<Partner>) => void;
}

export const PartnerDetailModal = memo(({
    partner,
    onClose,
    onUpdate
}: PartnerDetailModalProps) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        rank: partner.rank,
        pendingCashback: partner.pendingCashback,
        pointBalance: partner.pointBalance,
        totalSales: partner.totalSales
    });

    const handleSave = async () => {
        setLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    role_id: formData.rank,
                    pending_cashback: formData.pendingCashback,
                    point_balance: formData.pointBalance,
                    total_sales: formData.totalSales
                })
                .eq('id', partner.id);

            if (error) throw error;

            showToast('Partner updated successfully', 'success');
            onUpdate(partner.id, {
                rank: formData.rank,
                pendingCashback: formData.pendingCashback,
                pointBalance: formData.pointBalance,
                totalSales: formData.totalSales
            });
            setIsEditing(false);
        } catch (error) {
            adminLogger.error('Error updating partner', error);
            showToast('Failed to update partner', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-200">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-display font-bold text-slate-900">{partner.name}</h2>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                                    {RANK_NAMES[partner.rank] || 'Unknown'}
                                </span>
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    {partner.status}
                                </span>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-slate-900">{t('partnerdetailmodal.partner_details')}</h3>
                        {!isEditing ? (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                icon={<Edit2 className="w-4 h-4" />}
                            >
                                {t('partnerdetailmodal.edit_metrics')}</Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                                    {t('partnerdetailmodal.cancel')}</Button>
                                <Button
                                    variant="primary"
                                    size="sm"
                                    onClick={handleSave}
                                    isLoading={loading}
                                >
                                    {t('partnerdetailmodal.save_changes')}</Button>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs text-slate-500 mb-1">{t('partnerdetailmodal.rank')}</label>
                            {isEditing ? (
                                <select
                                    value={formData.rank}
                                    onChange={(e) => setFormData({ ...formData, rank: Number(e.target.value) })}
                                    className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#00575A] outline-none"
                                >
                                    {Object.entries(RANK_NAMES).map(([value, label]) => (
                                        <option key={value} value={value}>{label}</option>
                                    ))}
                                </select>
                            ) : (
                                <p className="text-sm font-medium text-slate-900">{RANK_NAMES[partner.rank]}</p>
                            )}
                        </div>

                        <div>
                            <Input
                                label="Total Sales"
                                type="number"
                                value={formData.totalSales}
                                onChange={(e) => setFormData({ ...formData, totalSales: Number(e.target.value) })}
                                disabled={!isEditing}
                                className={!isEditing ? "border-none p-0 !bg-transparent font-medium" : ""}
                            />
                        </div>

                        <div>
                            <Input
                                label="Pending Cashback"
                                type="number"
                                value={formData.pendingCashback}
                                onChange={(e) => setFormData({ ...formData, pendingCashback: Number(e.target.value) })}
                                disabled={!isEditing}
                                className={!isEditing ? "border-none p-0 !bg-transparent font-medium" : ""}
                            />
                        </div>

                        <div>
                            <Input
                                label="Point Balance"
                                type="number"
                                value={formData.pointBalance}
                                onChange={(e) => setFormData({ ...formData, pointBalance: Number(e.target.value) })}
                                disabled={!isEditing}
                                className={!isEditing ? "border-none p-0 !bg-transparent font-medium" : ""}
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <h3 className="font-semibold text-slate-900 mb-3">{t('partnerdetailmodal.contact_info')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-slate-500">{t('partnerdetailmodal.email')}</p>
                                <p className="text-sm text-slate-900">{partner.email}</p>
                            </div>
                            <div>
                                <p className="text-xs text-slate-500">{t('partnerdetailmodal.joined')}</p>
                                <p className="text-sm text-slate-900">{partner.joinDate}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
});
