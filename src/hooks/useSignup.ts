import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { authLogger } from '@/utils/logger';

export function useSignup() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { signUp } = useAuth();
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
            setError('Mật khẩu nhập lại không khớp');
            setLoading(false);
            return;
        }

        try {
            await signUp(formData.email, formData.password, formData.name);
            authLogger.info('Signup successful for:', formData.email);

            // Artificial delay for UX transitions
            setTimeout(() => navigate('/dashboard'), 500);
        } catch (e) {
            const err = e as Error;
            authLogger.error('Signup failed', err);
            setError(err.message || 'Đăng ký thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    }, [formData, signUp, navigate]);

    return {
        formData,
        error,
        loading,
        handleChange,
        handleSubmit
    };
}
