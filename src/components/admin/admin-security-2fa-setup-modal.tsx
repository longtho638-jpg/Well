import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Props {
    show: boolean;
    loading: boolean;
    qrPattern: boolean[];
    onClose: () => void;
    onConfirm: () => void;
}

export const AdminSecurity2FASetupModal: React.FC<Props> = ({ show, loading, qrPattern, onClose, onConfirm }) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0.95 }}
                        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Smartphone className="w-8 h-8 text-emerald-400" />
                            </div>
                            <h3 className="text-xl font-bold text-zinc-100">{t('adminsecuritysettings.thi_t_l_p_2fa')}</h3>
                            <p className="text-sm text-zinc-500 mt-2">{t('adminsecuritysettings.qu_t_m_qr_v_i_ng_d_ng_x_c_th')}</p>
                        </div>

                        <div className="bg-white p-4 rounded-xl mb-6 mx-auto w-48 h-48 flex items-center justify-center">
                            <div className="w-40 h-40 bg-zinc-200 rounded grid grid-cols-6 gap-0.5 p-2">
                                {qrPattern.map((filled, i) => (
                                    <div key={i} className={filled ? 'bg-zinc-900' : 'bg-white'} />
                                ))}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg"
                            >
                                {t('adminsecuritysettings.h_y')}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center gap-2"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                                {t('adminsecuritysettings.x_c_nh_n')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
