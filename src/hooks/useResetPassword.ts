/**
 * WellNexus Reset Password Hook
 * Uses react-hook-form + zod for validation and password update logic.
 */

import { useState, useEffect, useRef } from 'react';
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
    const navigate = useNavigate();
    const { t } = useTranslation();
    const redirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(resetPasswordSchema),
        defaultValues: {
            password: '',
            confirmPassword: '',
        },
        mode: 'onTouched',
    });

    // Cleanup on unmount
    useEffect(() => () => {
        if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
    }, []);

    // Listen for PASSWORD_RECOVERY event from Supabase (recovery token in URL hash)
    useEffect(() => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setServerError(''); // Valid recovery session established
            }
        });

        // Fallback: check if session already exists (e.g. page refresh)
        const timeout = setTimeout(async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setServerError(t('auth.resetPassword.invalidLink'));
            }
        }, 2000); // Allow time for Supabase to process URL hash

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, [t]);

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
            if (redirectTimeoutRef.current) clearTimeout(redirectTimeoutRef.current);
            redirectTimeoutRef.current = setTimeout(() => {
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
