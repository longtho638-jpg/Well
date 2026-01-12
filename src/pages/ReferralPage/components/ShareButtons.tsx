/**
 * ReferralPage Share Buttons Component
 * Social sharing functionality extracted from ReferralPage.tsx
 */

import { motion } from 'framer-motion';
import { Share2, Copy, Check, Mail, MessageCircle, QrCode } from 'lucide-react';

interface ShareButtonsProps {
    referralUrl: string;
    copiedLink: boolean;
    onCopyLink: () => void;
    onShareZalo: () => void;
    onShareFacebook: () => void;
    onShareTelegram: () => void;
    onShareEmail: () => void;
    onToggleQR: () => void;
    showQRCode: boolean;
    t: (key: string) => string;
}

export function ShareButtons({
    referralUrl,
    copiedLink,
    onCopyLink,
    onShareZalo,
    onShareFacebook,
    onShareTelegram,
    onShareEmail,
    onToggleQR,
    showQRCode,
    t
}: ShareButtonsProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-800/50 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-100 dark:border-slate-700 p-8"
        >
            <div className="flex items-start justify-between mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-slate-100 text-2xl mb-2 flex items-center gap-2">
                        <Share2 className="w-6 h-6 text-primary dark:text-teal-400" />
                        {t('referral.link.title')}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-slate-400">{t('referral.link.description')}</p>
                </div>
            </div>

            {/* Link Input */}
            <div className="bg-white dark:bg-slate-900 rounded-xl p-4 flex items-center gap-3 mb-6 shadow-md border-2 border-primary/20 dark:border-teal-600/30">
                <div className="flex-1 font-mono text-sm text-gray-700 dark:text-slate-300 truncate">
                    {referralUrl}
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onCopyLink}
                    className="px-5 py-2.5 bg-gradient-to-r from-primary to-teal-600 hover:shadow-lg active:scale-95 active:shadow-inner text-white rounded-lg flex items-center gap-2 transition-all font-semibold"
                >
                    {copiedLink ? (
                        <>
                            <Check className="w-5 h-5" />
                            {t('referral.link.copied')}
                        </>
                    ) : (
                        <>
                            <Copy className="w-5 h-5" />
                            {t('referral.link.copy')}
                        </>
                    )}
                </motion.button>
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onShareZalo}
                    className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 active:bg-blue-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
                >
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">Zalo</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onShareFacebook}
                    className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-slate-800 active:bg-blue-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
                >
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <span className="text-white font-bold text-lg">f</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">Facebook</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onShareTelegram}
                    className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-sky-50 dark:hover:bg-slate-800 active:bg-sky-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-sky-300 dark:hover:border-sky-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
                >
                    <div className="w-10 h-10 bg-sky-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">Telegram</span>
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onShareEmail}
                    className="px-4 py-3 bg-white dark:bg-slate-900 hover:bg-red-50 dark:hover:bg-slate-800 active:bg-red-100 dark:active:bg-slate-700 border-2 border-gray-200 dark:border-slate-600 hover:border-red-300 dark:hover:border-red-500 rounded-xl flex items-center gap-3 justify-center transition-all shadow-sm group"
                >
                    <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Mail className="w-5 h-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-slate-100">Email</span>
                </motion.button>
            </div>

            {/* QR Code Button */}
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onToggleQR}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:scale-95 text-white rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg font-bold text-lg group"
            >
                <QrCode className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                {showQRCode ? 'Ẩn QR Code' : 'Hiển Thị QR Code'}
            </motion.button>
        </motion.div>
    );
}
