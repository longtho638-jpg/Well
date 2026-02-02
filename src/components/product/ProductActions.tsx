/**
 * ProductActions - Buy and Share action buttons
 * Handles primary conversion actions with premium UI feedback.
 */

import React from 'react';
import { Share2, ShoppingBag, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface Props {
    onShare: () => void;
    onBuy: () => void;
    isBuying: boolean;
    showSuccess: boolean;
    outOfStock: boolean;
}

export const ProductActions: React.FC<Props> = ({ onShare, onBuy, isBuying, showSuccess, outOfStock }) => {
    const { t } = useTranslation();
    return (
        <div className="grid grid-cols-1 sm:grid-cols-5 gap-6">
            <button
                onClick={onShare}
                className="sm:col-span-2 flex items-center justify-center gap-4 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] border border-white/5 bg-zinc-900 hover:text-white hover:border-white/10 transition-all active:scale-95 italic"
            >
                <Share2 className="w-4 h-4" />
                {t('productactions.copy_ref_node')}</button>

            <button
                onClick={onBuy}
                disabled={isBuying || outOfStock || showSuccess}
                className={`sm:col-span-3 flex items-center justify-center gap-4 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-2xl active:scale-95 italic
                    ${showSuccess
                        ? 'bg-emerald-500 text-white'
                        : 'bg-white text-zinc-950 hover:bg-zinc-100 shadow-[0_10px_30px_rgba(255,255,255,0.1)]'
                    }
                    ${(outOfStock || isBuying) ? 'opacity-30 grayscale cursor-not-allowed shadow-none active:scale-100' : ''}
                `}
            >
                {isBuying ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                    <>
                        <ShoppingBag className="w-4 h-4" />
                        {outOfStock ? t('productactions.logistics_offline') : (showSuccess ? t('productactions.allocated_successfully') : t('productactions.order_prototype'))}
                    </>
                )}
            </button>
        </div>
    );
};
