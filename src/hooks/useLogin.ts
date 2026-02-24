/**
 * WellNexus Authentication Hook
 * Uses react-hook-form + zod for validation and login logic.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from './useAuth';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';
import { isAdmin } from '@/utils/admin-check';
import { loginSchema, type LoginFormValues } from '@/lib/schemas/auth';

export const useLogin = () => {
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [success, setSuccess] = useState(false);
    const { t } = useTranslation();

    const { signIn } = useAuth();
    const navigate = useNavigate();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    /**
     * Role-based navigation logic
     */
    const navigateAfterLogin = (userEmail: string) => {
        const userIsAdmin = isAdmin(userEmail);
        setSuccess(true);
        setLoading(false);

        setTimeout(() => {
            if (userIsAdmin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }, 800);
    };

    /**
     * Handle Login Submission (called by react-hook-form after validation)
     */
    const onSubmit = async (data: LoginFormValues) => {
        setLoading(true);
        setServerError('');

        try {
            let timeoutId: ReturnType<typeof setTimeout> | undefined;
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 30000);
            });

            const signInPromise = signIn(data.email, data.password);
            const result = await Promise.race([signInPromise, timeoutPromise]) as { error?: Error };
            if (timeoutId) clearTimeout(timeoutId);

            if (result?.error) throw result.error;

            navigateAfterLogin(data.email);
        } catch (err: unknown) {
            const errorObj = err as Error;
            authLogger.error('Login failed', errorObj);

            let errorMessage = t('errors.invalidCredentials');

            if (errorObj.message === 'TIMEOUT') {
                errorMessage = t('errors.timeout');
            } else if (errorObj.message?.includes('fetch') || errorObj.message?.includes('network')) {
                errorMessage = t('errors.network');
            } else if (errorObj.message?.includes('Email not confirmed')) {
                errorMessage = t('errors.emailNotConfirmed');
            }

            setServerError(errorMessage);
            setLoading(false);
        }
    };

    return {
        register: form.register,
        handleSubmit: form.handleSubmit(onSubmit),
        errors: form.formState.errors,
        serverError,
        loading,
        showPassword,
        setShowPassword,
        success,
    };
};
