import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { CartSummary } from '../../components/checkout/CartSummary';
import { GuestForm } from '../../components/checkout/GuestForm';
import { GuestInfoValues } from '../../utils/validation/checkoutSchema';
import { ArrowLeft, CreditCard, Loader2, QrCode, Banknote } from 'lucide-react';
import { orderService } from '../../services/orderService';
import { sendOrderConfirmationEmail } from '../../services/email-service';
import { useToast } from '../../components/ui/Toast';
import { uiLogger } from '../../utils/logger';
import { OrderPayload, PaymentMethod } from '../../types/checkout';
import { useTranslation } from '@/hooks';
import { createPayment, PaymentResponse } from '../../services/payment/payos-client';
import { QRPaymentModal } from '../../components/checkout/qr-payment-modal';

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const cartItems = useCartStore(state => state.items);
    const cartTotal = useCartStore(state => state.getTotal());
    const clearCart = useCartStore(state => state.clearCart);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
    const [pendingGuestInfo, setPendingGuestInfo] = useState<GuestInfoValues | null>(null);

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/marketplace');
        }
    }, [cartItems, navigate]);

    const handleCheckout = async (data: GuestInfoValues) => {
        setIsSubmitting(true);
        setPendingGuestInfo(data);

        try {
            if (paymentMethod === 'payos') {
                // Generate a numeric order code using timestamp for uniqueness
                // Format: last 6 digits of epoch ms + 4 random digits = 10 digits
                // Unique per millisecond, ~16 minute wrap cycle, combined with random suffix
                const tsPart = String(Date.now()).slice(-6);
                const randomSuffix = Math.floor(1000 + Math.random() * 9000);
                const orderCode = Number(`${tsPart}${randomSuffix}`);

                // Create PayOS Payment Link
                const response = await createPayment({
                    orderCode: orderCode,
                    amount: cartTotal,
                    description: `WellNexus Order ${orderCode}`,
                    items: cartItems.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        price: item.product.price
                    })),
                    returnUrl: `${window.location.origin}/checkout/success`,
                    cancelUrl: `${window.location.origin}/checkout`
                });

                if (response && response.checkoutUrl) {
                    setPaymentData(response);
                    setShowPaymentModal(true);
                } else {
                    throw new Error('Failed to create payment link');
                }
            } else {
                // COD Flow
                await processOrder(data, 'cod');
            }
        } catch (error) {
            uiLogger.error('Checkout failed:', error);
            showToast(t('checkout.error'), 'error');
            setIsSubmitting(false); // Only reset if error/COD. For PayOS, wait for modal.
        } finally {
             // For PayOS, we stay "submitting" until modal opens or fails
             if (paymentMethod === 'cod') {
                 setIsSubmitting(false);
             }
        }
    };

    const processOrder = async (guestData: GuestInfoValues, method: PaymentMethod, orderCode?: number) => {
        try {
            const payload: OrderPayload = {
                items: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                customer: {
                    guestProfile: guestData
                },
                paymentMethod: method,
                totalAmount: cartTotal,
                orderCode: orderCode
            };

            const orderId = await orderService.createOrder(payload);

            // Fire-and-forget order confirmation email
            if (guestData.email) {
                sendOrderConfirmationEmail(guestData.email, {
                    userName: guestData.fullName,
                    orderId,
                    orderDate: new Date().toLocaleDateString('vi-VN'),
                    totalAmount: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(cartTotal),
                    items: cartItems.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        price: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.product.price),
                    })),
                    shippingAddress: `${guestData.address.street}, ${guestData.address.ward}, ${guestData.address.district}, ${guestData.address.city}`,
                }).catch(err => uiLogger.error('Order confirmation email failed:', err));
            }

            clearCart();
            showToast(t('checkout.success'), 'success');
            navigate('/checkout/success');
        } catch (error) {
            uiLogger.error('Order creation failed:', error);
            showToast(t('checkout.error'), 'error');
            throw error;
        }
    };

    const handlePaymentSuccess = async (orderCode: number) => {
        if (pendingGuestInfo) {
            try {
                await processOrder(pendingGuestInfo, 'payos', orderCode);
                setShowPaymentModal(false);
            } catch {
                // Error handling already in processOrder
                setIsSubmitting(false);
            }
        }
    };

    const handlePaymentFailure = (error: string) => {
        showToast(error, 'error');
        setShowPaymentModal(false);
        setIsSubmitting(false);
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

                        {/* Payment Method Selection */}
                        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-white/10">
                            <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
                                <CreditCard size={20} className="text-teal-500" />
                                {t('checkout.payment.title')}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('cod')}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                                        paymentMethod === 'cod'
                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10'
                                            : 'border-zinc-200 dark:border-white/10 hover:border-teal-500/50'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        paymentMethod === 'cod' ? 'border-teal-500' : 'border-zinc-300'
                                    }`}>
                                        {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div className="flex items-center gap-2">
                                            <Banknote size={18} className="text-zinc-500" />
                                            <span className="font-bold text-zinc-900 dark:text-white">{t('checkout.payment.cod')}</span>
                                        </div>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setPaymentMethod('payos')}
                                    className={`relative p-4 rounded-xl border-2 transition-all flex items-center gap-4 ${
                                        paymentMethod === 'payos'
                                            ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/10'
                                            : 'border-zinc-200 dark:border-white/10 hover:border-teal-500/50'
                                    }`}
                                >
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                        paymentMethod === 'payos' ? 'border-teal-500' : 'border-zinc-300'
                                    }`}>
                                        {paymentMethod === 'payos' && <div className="w-2.5 h-2.5 rounded-full bg-teal-500" />}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <div className="flex items-center gap-2">
                                            <QrCode size={18} className="text-zinc-500" />
                                            <span className="font-bold text-zinc-900 dark:text-white">{t('checkout.payment.banking')}</span>
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
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

            {/* PayOS QR Modal */}
            <QRPaymentModal
                isOpen={showPaymentModal}
                onClose={() => {
                    setShowPaymentModal(false);
                    setIsSubmitting(false);
                }}
                paymentData={paymentData}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
            />
        </div>
    );
};
