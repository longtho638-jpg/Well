/**
 * Affiliate Link Section Component
 * Extracted from MarketingTools.tsx
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { QrCode, Copy, Download, Share2, CheckCircle2, TrendingUp } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface AffiliateLinkSectionProps {
    affiliateLink: string;
    qrCodeUrl: string;
    userName: string;
}

export function AffiliateLinkSection({ affiliateLink, qrCodeUrl, userName }: AffiliateLinkSectionProps) {
    const { t } = useTranslation();
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const handleCopyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(id);
        setTimeout(() => setCopiedText(null), 2000);
    };

    const handleDownloadQRCode = () => {
        const link = document.createElement('a');
        link.href = qrCodeUrl;
        link.download = `qr-code.png`;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShareQRCode = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: t('marketing.affiliate.shareTitle'),
                    text: t('marketing.affiliate.shareText'),
                    url: affiliateLink
                });
            } catch {
                // User cancelled share
            }
        } else {
            handleCopyText(affiliateLink, 'qr-link');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
            <div className="bg-gradient-to-r from-green-50 dark:from-slate-700 to-teal-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-green-500 to-teal-600 p-3 rounded-xl shadow-lg">
                        <QrCode className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('marketing.affiliate.title')}</h2>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.subtitle')}</p>
                    </div>
                </div>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Affiliate Link */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                {t('marketing.affiliate.linkLabel')}
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={affiliateLink}
                                    readOnly
                                    className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-700 dark:text-slate-300 font-mono text-sm"
                                />
                                <button
                                    onClick={() => handleCopyText(affiliateLink, 'affiliate-link')}
                                    className="bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
                                >
                                    {copiedText === 'affiliate-link' ? (
                                        <CheckCircle2 className="w-5 h-5" />
                                    ) : (
                                        <Copy className="w-5 h-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-green-50 dark:from-slate-700 to-teal-50 dark:to-slate-700 rounded-xl p-6 border-2 border-green-200 dark:border-slate-600">
                            <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-green-600" />
                                {t('marketing.affiliate.stats.title')}
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.stats.clicks')}</span>
                                    <span className="font-bold text-gray-900 dark:text-slate-100">245</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.stats.signups')}</span>
                                    <span className="font-bold text-green-600 dark:text-green-400">12</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.affiliate.stats.conversion')}</span>
                                    <span className="font-bold text-primary dark:text-cyan-400">{t('marketing.affiliate.stats.conversionValue')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-blue-50 dark:bg-slate-700 rounded-xl p-4 border border-blue-200 dark:border-slate-600">
                            <p className="text-sm text-gray-700 dark:text-slate-300">{t('marketing.affiliate.tip')}</p>
                        </div>
                    </div>

                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center">
                        <div className="bg-gradient-to-br from-green-100 dark:from-slate-700 to-teal-100 dark:to-slate-700 p-8 rounded-2xl border-4 border-white dark:border-slate-600 shadow-2xl">
                            <img
                                src={qrCodeUrl}
                                alt="QR Code"
                                className="w-64 h-64 rounded-xl"
                            />
                            <div className="mt-4 text-center">
                                <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1">
                                    {userName}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-slate-400">{t('marketing.affiliate.partnerLabel')}</p>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={handleDownloadQRCode}
                                className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg active:scale-95 transition-all"
                            >
                                <Download className="w-5 h-5" />
                                {t('marketing.affiliate.downloadQR')}
                            </button>
                            <button
                                onClick={handleShareQRCode}
                                className="flex items-center gap-2 bg-white dark:bg-slate-700 border-2 border-green-500 dark:border-green-400 text-green-600 dark:text-green-400 px-6 py-3 rounded-xl font-semibold hover:bg-green-50 dark:hover:bg-slate-600 active:scale-95 transition-all"
                            >
                                <Share2 className="w-5 h-5" />
                                {t('marketing.affiliate.share')}
                            </button>
                        </div>

                        <p className="text-xs text-gray-500 dark:text-slate-400 text-center mt-4 max-w-xs">
                            {t('marketing.affiliate.qrTip')}
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
