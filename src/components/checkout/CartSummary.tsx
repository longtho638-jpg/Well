import React from 'react';
import { useCartStore } from '../../store/cartStore';
import { formatVND } from '../../utils/format';
import { Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks';

export const CartSummary: React.FC = () => {
    const { t } = useTranslation();
    const items = useCartStore(state => state.items);
    const removeFromCart = useCartStore(state => state.removeFromCart);
    const getTotal = useCartStore(state => state.getTotal);
    const total = getTotal();

    if (items.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-white/10 text-center">
                <p className="text-zinc-500 dark:text-zinc-400">{t('cart.empty')}</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-white/10 sticky top-8">
            <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white">{t('cart.yourOrder')}</h3>

            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-2">
                {items.map((item) => (
                    <div key={item.product.id} className="flex gap-4 group">
                        <div className="w-16 h-16 rounded-xl overflow-hidden bg-zinc-100 shrink-0">
                            <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <h4 className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2">
                                    {item.product.name}
                                </h4>
                                <button
                                    onClick={() => removeFromCart(item.product.id)}
                                    className="text-zinc-400 hover:text-rose-500 transition-colors p-1"
                                    aria-label={t('cart.removeItem')}
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="flex justify-between items-end mt-1">
                                <p className="text-xs text-zinc-500">{t('cart.quantity')}: {item.quantity}</p>
                                <p className="text-sm font-bold text-teal-600 dark:text-teal-400">
                                    {formatVND(item.product.price * item.quantity)}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="border-t border-zinc-200 dark:border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-zinc-500">
                    <span>{t('cart.subtotal')}</span>
                    <span>{formatVND(total)}</span>
                </div>
                <div className="flex justify-between text-sm text-zinc-500">
                    <span>{t('cart.shipping')}</span>
                    <span>{t('cart.shippingFree')}</span>
                </div>
                <div className="flex justify-between text-lg font-black text-zinc-900 dark:text-white pt-2">
                    <span>{t('cart.total')}</span>
                    <span className="text-teal-600 dark:text-teal-400">{formatVND(total)}</span>
                </div>
            </div>
        </div>
    );
};
