/**
 * ProductPricing - Financial Allocation Matrix
 * Displays price and commission with premium visual treatment.
 */

import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { Product } from '@/types';
import { formatVND } from '@/utils/format';

interface Props {
    product: Product;
    commissionAmount: number;
}

export const ProductPricing: React.FC<Props> = ({ product, commissionAmount }) => {
    return (
        <div className="bg-zinc-900 border border-white/5 rounded-[3rem] p-10 mb-12 shadow-2xl group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-125 transition-transform duration-[3s]">
                <ShieldCheck size={120} />
            </div>

            <div className="grid grid-cols-2 gap-10 relative z-10">
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] italic mb-1">Market Valuation</p>
                    <p className="text-4xl font-black text-white tracking-tighter italic">{formatVND(product.price)}</p>
                </div>
                <div className="space-y-3 text-right">
                    <p className="text-[10px] font-black text-teal-400 uppercase tracking-[0.4em] italic mb-1">Node Yield (Profit)</p>
                    <div className="relative inline-block">
                        <div className="absolute inset-0 bg-teal-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-4xl font-black text-teal-400 tracking-tighter italic relative z-10">{formatVND(commissionAmount)}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
