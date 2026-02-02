import { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { validatePassword, PasswordValidation } from '@/utils/password-validation';

export function useSignup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [touchedPassword, setTouchedPassword] = useState(false);

    const { t } = useTranslation();
    const navigate = useNavigate();

    // Memoize password validation to avoid unnecessary recalculations
    const passwordValidation: PasswordValidation = useMemo(() => {
        return validatePassword(formData.password);
    }, [formData.password]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        if (name === 'password') {
            setTouchedPassword(true);
        }

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    }, []);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Strict Password Validation
        const validation = validatePassword(formData.password);
        if (!validation.isValid) {
            setError(t(validation.errors[0]) || 'Password does not meet requirements');
            setLoading(false);
            return;
        }

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
        passwordValidation,
        touchedPassword,
        handleChange,
        handleSubmit
    };
}
