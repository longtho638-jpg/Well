import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createGuestInfoSchema, GuestInfoValues } from '../../utils/validation/checkoutSchema';
import { User, Mail, Phone, MapPin, Map } from 'lucide-react';
import { useTranslation } from '@/hooks';

interface GuestFormProps {
    onSubmit: (data: GuestInfoValues) => void;
    isSubmitting?: boolean;
}

export const GuestForm: React.FC<GuestFormProps> = ({ onSubmit, isSubmitting: _isSubmitting = false }) => {
    const { t } = useTranslation();
    const guestInfoSchema = createGuestInfoSchema(t);

    const {
        register,
        handleSubmit,
        formState: { errors }
    } = useForm<GuestInfoValues>({
        resolver: zodResolver(guestInfoSchema)
    });

    return (
        <form id="guest-checkout-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-white/10">
                <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
                    <User size={20} className="text-teal-500" />
                    {t('checkout.guestInfo')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.fullName.label')}</label>
                        <div className="relative">
                            <input
                                {...register('fullName')}
                                placeholder={t('checkout.guestForm.fullName.placeholder')}
                                className={`w-full bg-zinc-50 dark:bg-black/20 border ${errors.fullName ? 'border-rose-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                            />
                            <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        </div>
                        {errors.fullName && <p className="text-xs text-rose-500 font-medium">{errors.fullName.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.phone.label')}</label>
                        <div className="relative">
                            <input
                                {...register('phone')}
                                placeholder={t('checkout.guestForm.phone.placeholder')}
                                className={`w-full bg-zinc-50 dark:bg-black/20 border ${errors.phone ? 'border-rose-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                            />
                            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        </div>
                        {errors.phone && <p className="text-xs text-rose-500 font-medium">{errors.phone.message}</p>}
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.email.label')}</label>
                        <div className="relative">
                            <input
                                {...register('email')}
                                placeholder={t('checkout.guestForm.email.placeholder')}
                                className={`w-full bg-zinc-50 dark:bg-black/20 border ${errors.email ? 'border-rose-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                            />
                            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                        </div>
                        {errors.email && <p className="text-xs text-rose-500 font-medium">{errors.email.message}</p>}
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-zinc-200 dark:border-white/10">
                <h3 className="text-xl font-bold mb-6 text-zinc-900 dark:text-white flex items-center gap-2">
                    <MapPin size={20} className="text-teal-500" />
                    {t('checkout.shippingAddress')}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.address.city.label')}</label>
                        <input
                            {...register('address.city')}
                            placeholder={t('checkout.guestForm.address.city.placeholder')}
                            className={`w-full bg-zinc-50 dark:bg-black/20 border ${errors.address?.city ? 'border-rose-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                        />
                        {errors.address?.city && <p className="text-xs text-rose-500 font-medium">{errors.address.city.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.address.district.label')}</label>
                        <input
                            {...register('address.district')}
                            placeholder={t('checkout.guestForm.address.district.placeholder')}
                            className={`w-full bg-zinc-50 dark:bg-black/20 border ${errors.address?.district ? 'border-rose-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                        />
                        {errors.address?.district && <p className="text-xs text-rose-500 font-medium">{errors.address.district.message}</p>}
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.address.ward.label')}</label>
                        <input
                            {...register('address.ward')}
                            placeholder={t('checkout.guestForm.address.ward.placeholder')}
                            className={`w-full bg-zinc-50 dark:bg-black/20 border ${errors.address?.ward ? 'border-rose-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                        />
                        {errors.address?.ward && <p className="text-xs text-rose-500 font-medium">{errors.address.ward.message}</p>}
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.address.street.label')}</label>
                    <div className="relative">
                        <input
                            {...register('address.street')}
                            placeholder={t('checkout.guestForm.address.street.placeholder')}
                            className={`w-full bg-zinc-50 dark:bg-black/20 border ${errors.address?.street ? 'border-rose-500' : 'border-zinc-200 dark:border-white/10'} rounded-xl px-4 py-3 pl-10 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all`}
                        />
                        <Map size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                    </div>
                    {errors.address?.street && <p className="text-xs text-rose-500 font-medium">{errors.address.street.message}</p>}
                </div>

                <div className="space-y-2 mt-6">
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{t('checkout.guestForm.note.label')}</label>
                    <textarea
                        {...register('note')}
                        placeholder={t('checkout.guestForm.note.placeholder')}
                        rows={3}
                        className="w-full bg-zinc-50 dark:bg-black/20 border border-zinc-200 dark:border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all resize-none"
                    />
                </div>
            </div>
        </form>
    );
};
