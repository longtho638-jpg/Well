import { z } from 'zod';

// Password validation regex patterns
const PASSWORD_REGEX = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  special: /[!@#$%^&*(),.?":{}|<>]/,
};

export const loginSchema = z.object({
  email: z.string().email('errors.invalidEmail'),
  password: z.string().min(1, 'errors.passwordRequired'),
  rememberMe: z.boolean().optional(),
});

export const signupSchema = z.object({
  name: z.string().min(2, 'auth.register.errors.nameTooShort'),
  email: z.string().email('errors.invalidEmail'),
  password: z.string()
    .min(8, 'auth.password.requirements.length')
    .regex(PASSWORD_REGEX.uppercase, 'auth.password.requirements.uppercase')
    .regex(PASSWORD_REGEX.lowercase, 'auth.password.requirements.lowercase')
    .regex(PASSWORD_REGEX.number, 'auth.password.requirements.number')
    .regex(PASSWORD_REGEX.special, 'auth.password.requirements.special'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'errors.passwordsDoNotMatch',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('errors.invalidEmail'),
});

export const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, 'auth.password.requirements.length')
    .regex(PASSWORD_REGEX.uppercase, 'auth.password.requirements.uppercase')
    .regex(PASSWORD_REGEX.lowercase, 'auth.password.requirements.lowercase')
    .regex(PASSWORD_REGEX.number, 'auth.password.requirements.number')
    .regex(PASSWORD_REGEX.special, 'auth.password.requirements.special'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'errors.passwordsDoNotMatch',
  path: ['confirmPassword'],
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type SignupFormValues = z.infer<typeof signupSchema>;
export type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;
