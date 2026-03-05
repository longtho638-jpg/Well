/**
 * WellNexus Authentication Hook
 * Uses react-hook-form + zod for validation and login logic.
 */

import { useState, useEffect, useRef } from 'react';
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
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { t } = useTranslation();

    const { signIn: _signIn } = useAuth();
    const navigate = useNavigate();

    const form = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
            rememberMe: false,
        },
    });

    // Cleanup on unmount
    useEffect(() => () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    /**
     * Role-based navigation logic
     */
    const navigateAfterLogin = (userEmail: string) => {
        const userIsAdmin = isAdmin(userEmail);
        setSuccess(true);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
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

        let timeoutId: ReturnType<typeof setTimeout> | undefined = undefined;

        try {
            const timeoutPromise = new Promise<unknown>((_, reject) => {
                timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), 30000);
            });

            const signInPromise = _signIn(data.email, data.password);
            const raceResult = await Promise.race([signInPromise, timeoutPromise]);
            const result = raceResult as { error?: Error } | undefined;

            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
                timeoutId = undefined;
            }

            if (result?.error) throw result.error;

            if (data.email) {
                navigateAfterLogin(data.email);
            }
        } catch (err: unknown) {
            if (timeoutId !== undefined) {
                clearTimeout(timeoutId);
            }

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
