import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { CartSummary } from '../../components/checkout/CartSummary';
import { GuestForm } from '../../components/checkout/GuestForm';
import { GuestInfoValues } from '../../utils/validation/checkoutSchema';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { useToast } from '../../components/ui/Toast';
import { uiLogger } from '../../utils/logger';
import { OrderPayload } from '../../types/checkout';
import { useTranslation } from '@/hooks';

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const cartItems = useCartStore(state => state.items);
    const cartTotal = useCartStore(state => state.getTotal());
    const clearCart = useCartStore(state => state.clearCart);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/marketplace');
        }
    }, [cartItems, navigate]);

    const handleCheckout = async (data: GuestInfoValues) => {
        setIsSubmitting(true);
        try {
            // Construct Order Payload
            const payload: OrderPayload = {
                items: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                customer: {
                    guestProfile: data
                },
                paymentMethod: 'cod', // Defaulting to COD for MVP
                totalAmount: cartTotal
            };

            await orderService.createOrder(payload);

            // Success
            clearCart();
            showToast(t('checkout.success'), 'success');
            navigate('/checkout/success');
        } catch (error) {
            uiLogger.error('Checkout failed:', error);
            showToast(t('checkout.error'), 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-black pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-zinc-200 dark:border-white/10">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <button
                        onClick={() => navigate('/marketplace')}
                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-bold">{t('checkout.backToShop')}</span>
                    </button>
                    <div className="text-lg font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                        {t('checkout.title')}
                    </div>
                    <div className="w-24"></div> {/* Spacer for center alignment */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Column: Form */}
                    <div className="lg:col-span-8 space-y-8">
                        <GuestForm onSubmit={handleCheckout} isSubmitting={isSubmitting} />
                    </div>

                    {/* Right Column: Summary & Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        <CartSummary />

                        <button
                            form="guest-checkout-form"
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full bg-teal-600 hover:bg-teal-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-teal-900/20 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="animate-spin" />
                                    {t('checkout.processing')}
                                </>
                            ) : (
                                <>
                                    <CreditCard size={20} />
                                    {t('checkout.placeOrder')}
                                </>
                            )}
                        </button>

                        <p className="text-xs text-center text-zinc-400 leading-relaxed px-4">
                            {t('checkout.terms')}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
