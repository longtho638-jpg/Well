/**
 * Gift Card Manager Component
 * Extracted from MarketingTools.tsx
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Gift, Copy, CheckCircle2, Plus, Eye, Tag } from 'lucide-react';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

// Gift Card Interface
export interface GiftCard {
    id: string;
    code: string;
    discount: number;
    type: 'percentage' | 'fixed';
    usageCount: number;
    createdAt: Date;
}

interface GiftCardManagerProps {
    giftCards: GiftCard[];
    onCreateCard: (card: GiftCard) => void;
}

export function GiftCardManager({ giftCards, onCreateCard }: GiftCardManagerProps) {
    const { t } = useTranslation();
    const [showCreateCard, setShowCreateCard] = useState(false);
    const [newCardCode, setNewCardCode] = useState('');
    const [newCardDiscount, setNewCardDiscount] = useState('');
    const [newCardType, setNewCardType] = useState<'percentage' | 'fixed'>('fixed');
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const handleCreateGiftCard = () => {
        if (!newCardCode || !newCardDiscount) return;

        const newCard: GiftCard = {
            id: Date.now().toString(),
            code: newCardCode.toUpperCase(),
            discount: parseFloat(newCardDiscount),
            type: newCardType,
            usageCount: 0,
            createdAt: new Date()
        };

        onCreateCard(newCard);
        setNewCardCode('');
        setNewCardDiscount('');
        setShowCreateCard(false);
    };

    const handleCopyText = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedText(id);
        setTimeout(() => setCopiedText(null), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className="bg-gradient-to-r from-pink-50 dark:from-slate-700 to-purple-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-gradient-to-br from-pink-500 to-purple-600 p-3 rounded-xl shadow-lg">
                            <Gift className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('marketing.giftCards.title')}</h2>
                            <p className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.giftCards.subtitle')}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowCreateCard(!showCreateCard)}
                        className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg active:scale-95 active:shadow-inner transition-all duration-300"
                    >
                        <Plus className="w-5 h-5" />
                        {t('marketing.giftCards.createNew')}
                    </button>
                </div>
            </div>

            <div className="p-6">
                {/* Create Gift Card Form */}
                {showCreateCard && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="bg-gradient-to-br from-pink-50 dark:from-slate-700 to-purple-50 dark:to-slate-700 rounded-xl p-6 mb-6 border-2 border-pink-200 dark:border-slate-600"
                    >
                        <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4">{t('marketing.giftCards.createTitle')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    {t('marketing.giftCards.codeLabel')}
                                </label>
                                <input
                                    type="text"
                                    value={newCardCode}
                                    onChange={(e) => setNewCardCode(e.target.value)}
                                    placeholder={t('marketing.giftCards.codePlaceholder')}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:border-pink-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    {t('marketing.giftCards.valueLabel')}
                                </label>
                                <input
                                    type="number"
                                    value={newCardDiscount}
                                    onChange={(e) => setNewCardDiscount(e.target.value)}
                                    placeholder={newCardType === 'fixed' ? '200000' : '15'}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:border-pink-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                                    {t('marketing.giftCards.typeLabel')}
                                </label>
                                <select
                                    value={newCardType}
                                    onChange={(e) => setNewCardType(e.target.value as 'percentage' | 'fixed')}
                                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100 focus:border-pink-500 focus:outline-none transition-all"
                                >
                                    <option value="fixed">{t('marketing.giftCards.typeFixed')}</option>
                                    <option value="percentage">{t('marketing.giftCards.typePercentage')}</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={handleCreateGiftCard}
                                className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-2 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                {t('marketing.giftCards.createButton')}
                            </button>
                            <button
                                onClick={() => setShowCreateCard(false)}
                                className="px-6 py-2 rounded-lg border-2 border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-100 hover:bg-gray-50 transition-all"
                            >
                                {t('marketing.giftCards.cancel')}
                            </button>
                        </div>
                    </motion.div>
                )}

                {/* Gift Cards List */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {giftCards.map((card, index) => (
                        <motion.div
                            key={card.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gradient-to-br from-pink-100 dark:from-slate-700 via-purple-100 dark:via-slate-700 to-blue-100 dark:to-slate-700 rounded-xl p-6 border-2 border-pink-200 dark:border-slate-600 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Tag className="w-5 h-5 text-pink-600" />
                                        <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{card.code}</h3>
                                    </div>
                                    <p className="text-3xl font-bold text-pink-600 dark:text-pink-400">
                                        {card.type === 'fixed' ? formatVND(card.discount) : `${card.discount}%`}
                                    </p>
                                </div>
                                <button
                                    onClick={() => handleCopyText(card.code, card.id)}
                                    className="bg-white dark:bg-slate-800 p-2 rounded-lg hover:bg-pink-50 dark:hover:bg-slate-700 transition-colors border border-pink-200 dark:border-slate-600"
                                >
                                    {copiedText === card.id ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <Copy className="w-5 h-5 text-pink-600" />
                                    )}
                                </button>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-slate-400">{t('marketing.giftCards.usageCount')}</span>
                                    <span className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-1">
                                        <Eye className="w-4 h-4 text-purple-600" />
                                        {card.usageCount}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600 dark:text-slate-400">{t('marketing.giftCards.createdDate')}</span>
                                    <span className="font-medium text-gray-900 dark:text-slate-100">
                                        {card.createdAt.toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}
