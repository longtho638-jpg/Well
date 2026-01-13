/**
 * ProductInfo - Product identity and metadata display
 * Renders name, rating, stock status, and description.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Star, CheckCircle } from 'lucide-react';
import { Product } from '@/types';

interface Props {
    product: Product;
}

export const ProductInfo: React.FC<Props> = ({ product }) => {
    return (
        <div className="mb-12">
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 mb-4"
            >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em] italic">Bio-Optic Optimization</span>
            </motion.div>
            <h1 className="text-6xl font-black text-white mb-8 tracking-tighter leading-[0.9] italic drop-shadow-sm">{product.name}</h1>

            <div className="flex flex-wrap items-center gap-8 mb-10">
                <div className="flex items-center gap-3">
                    <div className="flex items-center text-[#FFBF00]">
                        <Star className="w-4 h-4 fill-current" />
                    </div>
                    <span className="text-xs font-black text-white italic tracking-widest uppercase">4.9 Core Rating</span>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
                <div className="text-xs text-emerald-500 font-black flex items-center gap-3 uppercase tracking-widest italic">
                    <CheckCircle className="w-4 h-4" /> Available Capacity: {product.stock} Units
                </div>
            </div>

            <p className="text-zinc-500 text-lg leading-relaxed font-bold tracking-tight max-w-md">{product.description}</p>
        </div>
    );
};
