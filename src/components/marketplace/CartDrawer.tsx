import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, X, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import { CartItem } from '@/hooks/useMarketplace';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    items: CartItem[];
    total: number;
    itemCount: number;
    onUpdateQuantity: (id: string, delta: number) => void;
    onRemove: (id: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
    isOpen,
    onClose,
    items,
    total,
    itemCount,
    onUpdateQuantity,
    onRemove,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleCheckout = () => {
        onClose();
        navigate('/checkout');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[60]"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="fixed right-0 top-0 bottom-0 w-full sm:w-[480px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-white/10 shadow-3xl z-[70] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-zinc-100 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h2 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                                    <ShoppingCart className="w-8 h-8 text-teal-500" />
                                    {t('cartdrawer.your_cart')}</h2>
                                <div className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
                                    {itemCount} {t('cartdrawer.items_confirmed')}</div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-zinc-100 dark:bg-white/5 rounded-2xl hover:bg-zinc-200 dark:hover:bg-white/10 transition-colors"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length > 0 ? (
                                items.map((item) => (
                                    <motion.div
                                        key={item.product.id}
                                        layout
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="group bg-zinc-50 dark:bg-white/5 p-5 rounded-3xl flex gap-5 border border-transparent dark:hover:border-white/10 transition-all hover:bg-white dark:hover:bg-white/10"
                                    >
                                        <div className="w-24 h-24 overflow-hidden rounded-2xl shrink-0 shadow-lg">
                                            <img
                                                src={item.product.imageUrl}
                                                alt={item.product.name}
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between mb-2">
                                                <h3 className="text-sm font-black text-zinc-900 dark:text-white line-clamp-1">
                                                    {item.product.name}
                                                </h3>
                                                <button
                                                    onClick={() => onRemove(item.product.id)}
                                                    className="p-2 -mr-1 text-zinc-400 hover:text-rose-500 transition-colors touch-manipulation"
                                                    aria-label={`Remove ${item.product.name}`}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="text-lg font-black text-teal-500 mb-4">
                                                {formatVND(item.product.price)}
                                            </div>

                                            <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 p-1 rounded-xl border border-zinc-200 dark:border-white/10 w-fit">
                                                <button
                                                    onClick={() => onUpdateQuantity(item.product.id, -1)}
                                                    className="p-2.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-500 touch-manipulation"
                                                    aria-label="Decrease quantity"
                                                >
                                                    <Minus size={14} />
                                                </button>
                                                <span className="w-8 text-center font-black text-xs">{item.quantity}</span>
                                                <button
                                                    onClick={() => onUpdateQuantity(item.product.id, 1)}
                                                    className="p-2.5 hover:bg-zinc-100 dark:hover:bg-white/5 rounded-lg text-zinc-500 touch-manipulation"
                                                    aria-label="Increase quantity"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-24 h-24 bg-zinc-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                                        <ShoppingCart size={40} className="text-zinc-300 dark:text-white/20" />
                                    </div>
                                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-2">{t('cartdrawer.your_cart_is_empty')}</h3>
                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 px-10">{t('cartdrawer.start_adding_premium_products')}</p>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-8 border-t border-zinc-100 dark:border-white/10 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl">
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-zinc-400 font-bold uppercase text-[10px] tracking-[0.2em]">
                                    <span>{t('cartdrawer.subtotal')}</span>
                                    <span>{formatVND(total)}</span>
                                </div>
                                <div className="flex justify-between items-center text-zinc-900 dark:text-white text-3xl font-black tracking-tighter">
                                    <span>{t('cartdrawer.total')}</span>
                                    <span className="text-teal-500">{formatVND(total)}</span>
                                </div>
                            </div>
                            <button
                                onClick={handleCheckout}
                                disabled={items.length === 0}
                                className="w-full bg-teal-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-2xl shadow-teal-900/40 hover:bg-teal-500 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                            >
                                <CreditCard className="w-5 h-5" />
                                {t('cartdrawer.proceed_to_checkout')}</button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};
