/**
 * WellNexus Authentication Hook (Refactor)
 * Handles login state, validation, and role-based navigation.
 * 
 * Separates UI state from business logic for better maintainability.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { authLogger } from '@/utils/logger';

// SECURITY: Production admin whitelist - NO demo accounts
const ADMIN_EMAILS = [
    'longtho638@gmail.com',
    'doanhnhancaotuan@gmail.com'
    // NOTE: demo@wellnexus.vn REMOVED - real users are making purchases
];

export const useLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const [success, setSuccess] = useState(false);

    const { signIn } = useAuth();
    const navigate = useNavigate();

    /**
     * Role-based navigation logic
     */
    const navigateAfterLogin = (userEmail: string) => {
        const isAdmin = ADMIN_EMAILS.includes(userEmail.toLowerCase());
        setSuccess(true);
        setLoading(false);

        setTimeout(() => {
            if (isAdmin) {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }, 800);
    };

    /**
     * Handle Login Submission
     */
    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        setLoading(true);
        setError('');

        try {
            // Timeout promise (30s)
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), 30000)
            );

            const signInPromise = signIn(email, password);
            const result = await Promise.race([signInPromise, timeoutPromise]) as { error?: Error };

            if (result?.error) throw result.error;

            navigateAfterLogin(email);
        } catch (err: unknown) {
            const errorObj = err as Error;
            authLogger.error('Login failed', errorObj);

            let errorMessage = 'Email hoặc mật khẩu không đúng.';

            if (errorObj.message === 'TIMEOUT') {
                errorMessage = 'Đăng nhập quá thời gian. Vui lòng kiểm tra kết nối mạng.';
            } else if (errorObj.message?.includes('fetch') || errorObj.message?.includes('network')) {
                errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
            } else if (errorObj.message?.includes('Email not confirmed')) {
                errorMessage = 'Email chưa được xác nhận. Vui lòng kiểm tra hộp thư.';
            }

            setError(errorMessage);
            setLoading(false);
        }
    };

    /**
     * Handle Demo Login
     */
    const handleTryDemo = () => {
        setEmail('demo@wellnexus.vn');
        setPassword('demo123');
        // Trigger login with a small delay to allow state updates
        setTimeout(() => {
            handleSubmit();
        }, 100);
    };

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        loading,
        showPassword,
        setShowPassword,
        rememberMe,
        setRememberMe,
        success,
        handleSubmit,
        handleTryDemo
    };
};
