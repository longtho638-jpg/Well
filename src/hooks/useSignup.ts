import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';
import { useAuth } from '@/hooks/useAuth';
import { validatePassword, PasswordValidation } from '@/utils/password-validation';
import { sendWelcomeEmail } from '@/services/email-service';
import { signupSchema, SignupFormValues } from '@/lib/schemas/auth';

export function useSignup() {
    const [signupSuccess, setSignupSuccess] = useState(false);

    const { t } = useTranslation();
    const { signUp } = useAuth();

    const form = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        mode: 'onTouched',
    });

    const watchedPassword = form.watch('password');

    const passwordValidation: PasswordValidation = useMemo(() => {
        return validatePassword(watchedPassword ?? '');
    }, [watchedPassword]);

    const onSubmit = async (data: SignupFormValues) => {
        try {
            // Use useAuth.signUp() which creates BOTH auth account AND users table record
            await signUp(data.email, data.password, data.name);

            authLogger.info('Signup successful for:', data.email);

            // Send welcome email (fire-and-forget — don't block signup success UX)
            sendWelcomeEmail(data.email, {
                userName: data.name,
                userEmail: data.email,
            }).catch((err) => authLogger.error('Welcome email failed', err));

            // Show success state - user needs to confirm email
            setSignupSuccess(true);
        } catch (e) {
            const err = e as Error;
            authLogger.error('Signup failed', err);

            // Map Supabase errors to user-friendly messages
            const message = err.message?.includes('already registered')
                ? t('errors.emailAlreadyRegistered')
                : err.message || t('errors.signupFailed');

            form.setError('root', { message });
        }
    };

    return {
        form,
        passwordValidation,
        signupSuccess,
        onSubmit,
    };
}
