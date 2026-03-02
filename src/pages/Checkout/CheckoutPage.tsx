import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CartSummary } from '../../components/checkout/CartSummary';
import { GuestForm } from '../../components/checkout/GuestForm';
import { ArrowLeft, CreditCard, Loader2, QrCode, Banknote } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { QRPaymentModal } from '../../components/checkout/qr-payment-modal';
import { useCheckoutPagePaymentHandler } from './use-checkout-page-payment-handler';

export const CheckoutPage: React.FC = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const {
        isSubmitting,
        paymentMethod,
        setPaymentMethod,
        showPaymentModal,
        paymentData,
        handleCheckout,
        handlePaymentSuccess,
        handlePaymentFailure,
        closePaymentModal,
    } = useCheckoutPagePaymentHandler();

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
                onClose={closePaymentModal}
                paymentData={paymentData}
                onSuccess={handlePaymentSuccess}
                onFailure={handlePaymentFailure}
            />
        </div>
    );
};
