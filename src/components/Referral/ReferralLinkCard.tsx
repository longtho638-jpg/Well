import React from 'react';
import { motion } from 'framer-motion';
import { Share2, Copy, Check, MessageCircle, Mail, Facebook, QrCode } from 'lucide-react';

interface ReferralLinkCardProps {
    referralUrl: string;
    copiedLink: boolean;
    onCopy: () => void;
    onShareZalo: () => void;
    onShareFB: () => void;
    onShareTelegram: () => void;
    onShareEmail: () => void;
    onToggleQR: () => void;
    showQRCode: boolean;
    t: (key: string) => string;
}

export const ReferralLinkCard: React.FC<ReferralLinkCardProps> = ({
    referralUrl,
    copiedLink,
    onCopy,
    onShareZalo,
    onShareFB,
    onShareTelegram,
    onShareEmail,
    onToggleQR,
    showQRCode,
    t
}) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="bg-zinc-900/50 backdrop-blur-3xl border border-white/5 p-10 rounded-[3rem] shadow-2xl space-y-8"
    >
        <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-teal-500/10 border border-teal-500/20 rounded-2xl flex items-center justify-center">
                <Share2 className="w-6 h-6 text-teal-400" />
            </div>
            <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">{t('referral.link.title')}</h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest italic">{t('referral.link.description')}</p>
            </div>
        </div>

        <div className="bg-zinc-950 rounded-2xl p-4 flex items-center gap-4 border border-white/5 group">
            <div className="flex-1 font-mono text-xs text-zinc-400 truncate pl-2">
                {referralUrl}
            </div>
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onCopy}
                className="px-6 py-3 bg-white text-zinc-950 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all"
            >
                {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                {copiedLink ? t('referral.link.copied') : t('referral.link.copy')}
            </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <ShareButton icon={MessageCircle} label={t('referral.link.shareVia') + ' Zalo'} color="bg-blue-600" onClick={onShareZalo} />
            <ShareButton icon={Facebook} label={t('referral.link.shareVia') + ' Facebook'} color="bg-blue-700" onClick={onShareFB} />
            <ShareButton icon={MessageCircle} label={t('referral.link.shareVia') + ' Telegram'} color="bg-sky-500" onClick={onShareTelegram} />
            <ShareButton icon={Mail} label={t('referral.link.email')} color="bg-rose-500" onClick={onShareEmail} />
        </div>

        <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onToggleQR}
            className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all italic border
                ${showQRCode ? 'bg-zinc-100 text-zinc-900 border-white' : 'bg-gradient-to-r from-teal-500 to-cyan-500 text-zinc-950 border-transparent shadow-[0_0_30px_rgba(20,184,166,0.3)]'}`}
        >
            <QrCode size={18} />
            {showQRCode ? t('referral.link.dismiss_visual_key') : t('referral.link.generate_visual_key')}
        </motion.button>
    </motion.div>
);

const ShareButton = ({ icon: Icon, label, color, onClick }: { icon: React.ElementType; label: string; color: string; onClick: () => void }) => (
    <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="flex items-center gap-4 p-4 bg-zinc-950 border border-white/5 rounded-2xl group hover:border-white/20 transition-all"
    >
        <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon size={18} className="text-white" />
        </div>
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">{label}</span>
    </motion.button>
);
