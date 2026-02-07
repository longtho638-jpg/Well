/**
 * WellNexus Reset Password Hook
 * Uses react-hook-form + zod for validation and password update logic.
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { resetPasswordSchema, type ResetPasswordFormValues } from '@/lib/schemas/auth';

export function useResetPassword() {
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { t } = useTranslation();
    const navigate = useNavigate();

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
        mode: 'onTouched',
    });

    // Check if user has valid recovery token
    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setServerError('Invalid or expired reset link. Please request a new one.');
            }
        };
        checkSession();
    }, []);

    const onSubmit = async (data: ResetPasswordFormValues) => {
        setServerError('');
        setLoading(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: data.password,
            });

            if (updateError) {
                setServerError(t('auth.resetPassword.errorMessage'));
                return;
            }

            setSuccess(true);

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch {
            setServerError(t('auth.resetPassword.errorMessage'));
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
        showPassword,
        setShowPassword,
        showConfirmPassword,
        setShowConfirmPassword,
    };
}
