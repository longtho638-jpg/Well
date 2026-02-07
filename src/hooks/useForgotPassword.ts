/**
 * WellNexus Forgot Password Hook
 * Uses react-hook-form + zod for validation and password reset request logic.
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '@/lib/schemas/auth';

export function useForgotPassword() {
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const { t } = useTranslation();

    const form = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    });

    const onSubmit = async (data: ForgotPasswordFormValues) => {
        setServerError('');
        setLoading(true);

        try {
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(data.email, {
                redirectTo: `${window.location.origin}/reset-password`,
            });

            if (resetError) {
                setServerError(t('auth.forgotPassword.errorMessage'));
                return;
            }

            setSuccess(true);
        } catch {
            setServerError(t('auth.forgotPassword.errorMessage'));
        } finally {
            setLoading(false);
        }
    };

    return {
        register: form.register,
        handleSubmit: form.handleSubmit(onSubmit),
        errors: form.formState.errors,
        serverError,
        loading,
        success,
    };
}
