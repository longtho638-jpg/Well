import React from 'react';
import { motion } from 'framer-motion';
import { QrCode, Download } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface ReferralQRCodeProps {
    qrCodeUrl: string;
    onDownload: () => void;
}

export const ReferralQRCode: React.FC<ReferralQRCodeProps> = ({ qrCodeUrl, onDownload }) => {
    const { t } = useTranslation();
    return (
    <motion.div
        initial={{ opacity: 0, scale: 0.9, x: 20 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: 20 }}
        className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl text-center"
    >
        <div className="flex items-center justify-center gap-6 mb-10">
            <div className="w-12 h-12 bg-white text-zinc-950 rounded-2xl flex items-center justify-center">
                <QrCode size={24} />
            </div>
            <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t('referral.qrcode.visual_id_key')}</h3>
        </div>

        <div className="bg-white rounded-[2rem] p-8 shadow-2xl inline-block mb-10 group relative">
            <div className="absolute inset-0 bg-teal-500/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <img
                src={qrCodeUrl}
                alt={t('referralqrcode.qr_code_alt')}
                className="w-64 h-64 mx-auto relative z-10"
            />
            <div className="mt-6 text-center relative z-10">
                <p className="text-[10px] font-black text-zinc-950 uppercase tracking-[0.3em] mb-1 italic">{t('referral.qrcode.wellnexus_network')}</p>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{t('referral.qrcode.scanning_initiates_sync')}</p>
            </div>
        </div>

        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onDownload}
            className="w-full py-5 bg-zinc-100 text-zinc-900 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all italic border-white shadow-xl"
        >
            <Download size={18} />
            {t('referral.qrcode.commit_to_local_storage')}</motion.button>

        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-6 italic">
            {t('referral.qrcode.recommended_for_high_conversio')}</p>
    </motion.div>
);
};