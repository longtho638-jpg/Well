import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authLogger } from '@/utils/logger';
import { useTranslation } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { validatePassword, PasswordValidation } from '@/utils/password-validation';
import { sendWelcomeEmail } from '@/services/email-service';
import { signupSchema, SignupFormValues } from '@/lib/schemas/auth';

export function useSignup() {
    const [signupSuccess, setSignupSuccess] = useState(false);

    const { t } = useTranslation();

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
            // Capture sponsor from referral link (/ref/:id → sessionStorage)
            const sponsorId = sessionStorage.getItem('wellnexus_sponsor_id');

            const { error: signUpError } = await supabase.auth.signUp({
                email: data.email,
                password: data.password,
                options: {
                    data: {
                        name: data.name,
                        role_id: 8, // Default to CTV/Member
                        ...(sponsorId ? { sponsor_id: sponsorId } : {}),
                    },
                    emailRedirectTo: `${window.location.origin}/confirm-email`,
                },
            });

            if (signUpError) throw signUpError;

            authLogger.info('Signup successful for:', data.email);

            // Send welcome email (fire-and-forget — don't block signup success UX)
            sendWelcomeEmail(data.email, {
                userName: data.name,
                userEmail: data.email,
            }).catch((err) => authLogger.error('Welcome email failed', err));

            // Clear sponsor from sessionStorage after successful signup
            sessionStorage.removeItem('wellnexus_sponsor_id');

            // Show success state - user needs to confirm email
            setSignupSuccess(true);
        } catch (e) {
            const err = e as Error;
            authLogger.error('Signup failed', err);
            form.setError('root', {
                message: err.message || t('errors.signupFailed'),
            });
        }
    };

    return {
        form,
        passwordValidation,
        signupSuccess,
        onSubmit,
    };
}
