import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useSignup } from '@/hooks/useSignup';
import { useTranslation } from '@/hooks';
import { PasswordStrengthMeter } from './PasswordStrengthMeter';

export const SignupForm: React.FC = () => {
    const { t } = useTranslation();
    const {
        form,
        passwordValidation,
        signupSuccess,
        onSubmit,
    } = useSignup();

    const { register, handleSubmit, formState: { errors, isSubmitting, touchedFields }, watch } = form;
    const watchedPassword = watch('password');

    return (
        <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] relative">
            {/* Success Overlay */}
            <AnimatePresence>
                {signupSuccess && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 z-50 bg-slate-950/90 backdrop-blur-md rounded-[2.5rem] flex flex-col items-center justify-center text-white p-8"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                            className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mb-4"
                        >
                            <CheckCircle className="w-8 h-8 text-white" />
                        </motion.div>
                        <h3 className="text-2xl font-bold mb-2">{t('auth.register.checkEmail')}</h3>
                        <p className="text-slate-300 text-center text-sm max-w-sm">
                            {t('auth.register.emailSentMessage', { email: form.getValues('email') })}
                        </p>
                        <div className="mt-6 text-xs text-slate-400 text-center">
                            <p>{t('auth.register.didntReceive')}</p>
                            <button className="text-teal-400 hover:text-teal-300 underline mt-1">
                                {t('auth.register.resendEmail')}</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {errors.root && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-4 mb-8"
                >
                    <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-rose-200 font-medium leading-relaxed">{errors.root.message}</p>
                </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        {t('auth.register.fullName')}</label>
                    <div className="relative group">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="text"
                            {...register('name')}
                            placeholder={t('auth.register.placeholders.name')}
                            className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all placeholder:text-slate-700 font-medium"
                        />
                    </div>
                    {errors.name && (
                        <p className="text-xs text-rose-400 ml-1">{t(errors.name.message ?? '')}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                        {t('auth.register.emailBusiness')}</label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                        <input
                            type="email"
                            {...register('email')}
                            placeholder={t('auth.register.placeholders.email')}
                            className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all placeholder:text-slate-700 font-medium"
                        />
                    </div>
                    {errors.email && (
                        <p className="text-xs text-rose-400 ml-1">{t(errors.email.message ?? '')}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            {t('auth.register.password')}</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="password"
                                {...register('password')}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all placeholder:text-slate-700"
                            />
                        </div>
                        {/* Password Strength Meter */}
                        {(watchedPassword || touchedFields.password) && (
                            <PasswordStrengthMeter
                                validation={passwordValidation}
                                showDetails={!!watchedPassword}
                            />
                        )}
                        {errors.password && !watchedPassword && (
                            <p className="text-xs text-rose-400 ml-1">{t(errors.password.message ?? '')}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                            {t('auth.register.confirmPassword')}</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600 group-focus-within:text-teal-500 transition-colors" />
                            <input
                                type="password"
                                {...register('confirmPassword')}
                                placeholder="••••••••"
                                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500/50 transition-all placeholder:text-slate-700"
                            />
                        </div>
                        {errors.confirmPassword && (
                            <p className="text-xs text-rose-400 ml-1">{t(errors.confirmPassword.message ?? '')}</p>
                        )}
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-black py-4.5 rounded-2xl shadow-xl shadow-teal-900/30 flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:grayscale group uppercase tracking-[0.2em] text-xs"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {t('auth.register.processing')}</>
                        ) : (
                            <>
                                {t('auth.register.registerButton')}<ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
};
