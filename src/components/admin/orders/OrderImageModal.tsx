import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface OrderImageModalProps {
    imageUrl: string | null;
    onClose: () => void;
}

export const OrderImageModal: React.FC<OrderImageModalProps> = ({ imageUrl, onClose }) => {
    const { t } = useTranslation();
    return (
        <AnimatePresence>
            {imageUrl && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-zinc-950/95 z-[100] flex items-center justify-center p-6 backdrop-blur-2xl"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        className="relative max-w-5xl w-full bg-zinc-900 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border border-white/5"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* High-Fidelity Header */}
                        <div className="p-8 bg-white/[0.02] border-b border-white/5 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-teal-500/10 rounded-2xl flex items-center justify-center border border-teal-500/20">
                                    <ShieldCheck className="text-teal-500" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-white font-black text-xl italic tracking-tight uppercase">{t('orderimagemodal.evidence_inspection')}</h3>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.3em] mt-0.5">{t('orderimagemodal.payment_verification_system_v3')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <motion.a
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    href={imageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-6 py-3 bg-zinc-800 text-zinc-300 hover:text-white rounded-2xl transition-all border border-zinc-700/50 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest italic shadow-xl"
                                    title="Open Source in and Expand"
                                >
                                    <ExternalLink size={16} />
                                    {t('orderimagemodal.external_view')}</motion.a>
                                <motion.button
                                    whileHover={{ scale: 1.1, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={onClose}
                                    className="w-14 h-14 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-2xl flex items-center justify-center transition-all border border-rose-500/20 shadow-xl"
                                >
                                    <X size={24} />
                                </motion.button>
                            </div>
                        </div>

                        {/* High-Contrast Image Viewport */}
                        <div className="p-10 bg-zinc-950 flex items-center justify-center min-h-[500px] relative">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,87,90,0.05)_0%,transparent_70%)]" />
                            <motion.img
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                src={imageUrl}
                                alt="Payment proof"
                                className="relative z-10 w-full h-auto max-h-[65vh] object-contain rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/5"
                            />
                        </div>

                        {/* Critical Safety Protocol Footer */}
                        <div className="p-6 bg-amber-500/[0.03] border-t border-amber-500/10">
                            <div className="flex items-center justify-center gap-3 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] italic">
                                <AlertTriangle size={16} className="animate-pulse" />
                                <span>{t('orderimagemodal.security_protocol_cross_verif')}</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};
