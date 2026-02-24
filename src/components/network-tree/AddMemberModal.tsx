import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { useToast } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { uiLogger } from '@/utils/logger';

interface AddMemberModalProps {
    sponsorId: string;
    sponsorName: string;
    onClose: () => void;
    onSuccess: () => void;
}

export const AddMemberModal: React.FC<AddMemberModalProps> = ({ sponsorId, sponsorName, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role_id: 8 // Default to CTV
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name,
                        role_id: formData.role_id,
                        sponsor_id: sponsorId
                    }
                }
            });

            if (authError) throw authError;

            showToast(t('networktree.toast.added_success', { name: formData.name }), 'success');
            onSuccess();
            onClose();
        } catch (err) {
            const error = err as Error;
            uiLogger.error('Error adding member', error);
            showToast(error.message || t('networktree.toast.add_failed'), 'error');
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
                className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-white">{t('networktree.nh_p_c_y_add_member')}</h3>
                        <p className="text-sm text-zinc-400">{t('networktree.sponsor')}<span className="text-emerald-400 font-medium">{sponsorName}</span></p>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">{t('networktree.full_name')}</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder={t('networktree.name_placeholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">{t('networktree.email')}</label>
                        <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder={t('networktree.email_placeholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">{t('networktree.phone')}</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder={t('networktree.phone_placeholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">{t('networktree.password')}</label>
                        <input
                            type="password"
                            required
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                            placeholder={t('networktree.password_placeholder')}
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">{t('networktree.rank')}</label>
                        <select
                            value={formData.role_id}
                            onChange={(e) => setFormData({ ...formData, role_id: Number(e.target.value) })}
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-emerald-500"
                        >
                            <option value={8}>{t('networktree.c_ng_t_c_vi_n_ctv')}</option>
                            <option value={7}>{t('networktree.kh_i_nghi_p')}</option>
                            <option value={6}>{t('networktree.i_s')}</option>
                        </select>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UserPlus className="w-5 h-5" />}
                            {t('networktree.add_member')}</button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};
