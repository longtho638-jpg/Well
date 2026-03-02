/**
 * use-checkout-page-payment-handler — payment state, COD/PayOS flow, order processing logic for CheckoutPage
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import { GuestInfoValues } from '../../utils/validation/checkoutSchema';
import { orderService } from '../../services/orderService';
import { sendOrderConfirmationEmail } from '../../services/email-service';
import { useToast } from '../../components/ui/Toast';
import { uiLogger } from '../../utils/logger';
import { OrderPayload, PaymentMethod } from '../../types/checkout';
import { useTranslation } from '@/hooks';
import { createPayment, PaymentResponse } from '../../services/payment/payos-client';

export function useCheckoutPagePaymentHandler() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { showToast } = useToast();
    const cartItems = useCartStore(state => state.items);
    const getTotal = useCartStore(state => state.getTotal);
    const cartTotal = getTotal();
    const clearCart = useCartStore(state => state.clearCart);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod');
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentData, setPaymentData] = useState<PaymentResponse | null>(null);
    const [pendingGuestInfo, setPendingGuestInfo] = useState<GuestInfoValues | null>(null);

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate('/marketplace');
        }
    }, [cartItems, navigate]);

    const processOrder = async (guestData: GuestInfoValues, method: PaymentMethod, orderCode?: number) => {
        try {
            const payload: OrderPayload = {
                items: cartItems.map(item => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    price: item.product.price,
                })),
                customer: { guestProfile: guestData },
                paymentMethod: method,
                totalAmount: cartTotal,
                orderCode,
            };

            const orderId = await orderService.createOrder(payload);

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

    const handleCheckout = async (data: GuestInfoValues) => {
        setIsSubmitting(true);
        setPendingGuestInfo(data);

        try {
            if (paymentMethod === 'payos') {
                const epochSec = Math.floor(Date.now() / 1000);
                const tsPart = epochSec % 100000;
                const randomSuffix = Math.floor(100 + Math.random() * 900);
                const orderCode = Number(`${tsPart}${randomSuffix}`);

                const response = await createPayment({
                    orderCode,
                    amount: cartTotal,
                    description: `WellNexus Order ${orderCode}`,
                    items: cartItems.map(item => ({
                        name: item.product.name,
                        quantity: item.quantity,
                        price: item.product.price,
                    })),
                    returnUrl: `${window.location.origin}/checkout/success`,
                    cancelUrl: `${window.location.origin}/checkout`,
                });

                if (response && response.checkoutUrl) {
                    setPaymentData(response);
                    setShowPaymentModal(true);
                } else {
                    throw new Error('Failed to create payment link');
                }
            } else {
                await processOrder(data, 'cod');
            }
        } catch (error) {
            uiLogger.error('Checkout failed:', error);
            showToast(t('checkout.error'), 'error');
            setIsSubmitting(false);
        } finally {
            if (paymentMethod === 'cod') {
                setIsSubmitting(false);
            }
        }
    };

    const handlePaymentSuccess = async (orderCode: number) => {
        if (!pendingGuestInfo) return;
        const guestInfo = pendingGuestInfo;
        setPendingGuestInfo(null);
        try {
            await processOrder(guestInfo, 'payos', orderCode);
            setShowPaymentModal(false);
        } catch {
            setIsSubmitting(false);
        }
    };

    const handlePaymentFailure = (error: string) => {
        showToast(error, 'error');
        setShowPaymentModal(false);
        setIsSubmitting(false);
    };

    const closePaymentModal = () => {
        setShowPaymentModal(false);
        setIsSubmitting(false);
        setPendingGuestInfo(null);
    };

    return {
        cartTotal,
        isSubmitting,
        paymentMethod,
        setPaymentMethod,
        showPaymentModal,
        paymentData,
        handleCheckout,
        handlePaymentSuccess,
        handlePaymentFailure,
        closePaymentModal,
    };
}
