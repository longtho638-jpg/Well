import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';
import { supabase } from '@/lib/supabase';

export function useSignup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { t } = useTranslation();
    const navigate = useNavigate();

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError(t('errors.passwordsDoNotMatch'));
            setLoading(false);
            return;
        }

        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        name: formData.name
                    }
                }
            });

            if (signUpError) throw signUpError;

            authLogger.info('Signup successful for:', formData.email);

            // Artificial delay for UX transitions
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (e) {
            const err = e as Error;
            authLogger.error('Signup failed', err);
            setError(err.message || t('errors.signupFailed'));
        } finally {
            setLoading(false);
        }
    }, [formData, navigate, t]);

    return {
        formData,
        error,
        loading,
        handleChange,
        handleSubmit
    };
}
