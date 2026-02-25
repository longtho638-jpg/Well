/**
 * Form Handling Utilities
 * Phase 10: Forms and Responsive
 */

import { useState, useEffect, useCallback, ChangeEvent, FormEvent } from 'react';

// ============================================================================
// USE FORM HOOK
// ============================================================================

interface UseFormOptions<T> {
    initialValues: T;
    validate?: (values: T) => Partial<Record<keyof T, string>>;
    onSubmit: (values: T) => Promise<void> | void;
}

interface UseFormReturn<T> {
    values: T;
    errors: Partial<Record<keyof T, string>>;
    touched: Partial<Record<keyof T, boolean>>;
    isSubmitting: boolean;
    isValid: boolean;
    handleChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleBlur: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleSubmit: (e: FormEvent) => Promise<void>;
    setFieldValue: (field: keyof T, value: T[keyof T]) => void;
    setFieldError: (field: keyof T, error: string) => void;
    reset: () => void;
}

export function useForm<T extends Record<string, unknown>>(
    options: UseFormOptions<T>
): UseFormReturn<T> {
    const { initialValues, validate, onSubmit } = options;

    const [values, setValues] = useState<T>(initialValues);
    const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
    const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = useCallback(() => {
        if (!validate) return {};
        return validate(values);
    }, [validate, values]);

    const isValid = Object.keys(validateForm()).length === 0;

    const handleChange = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        const inputValue = type === 'checkbox'
            ? (e.target as HTMLInputElement).checked
            : value;

        setValues(prev => ({ ...prev, [name]: inputValue }));

        // Clear error on change
        if (errors[name as keyof T]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }, [errors]);

    const handleBlur = useCallback((
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));

        // Validate on blur
        if (validate) {
            const fieldErrors = validate(values);
            if (fieldErrors[name as keyof T]) {
                setErrors(prev => ({ ...prev, [name]: fieldErrors[name as keyof T] }));
            }
        }
    }, [validate, values]);

    const handleSubmit = useCallback(async (e: FormEvent) => {
        e.preventDefault();

        // Mark all fields as touched
        const allTouched = Object.keys(values).reduce((acc, key) => {
            acc[key as keyof T] = true;
            return acc;
        }, {} as Record<keyof T, boolean>);
        setTouched(allTouched);

        // Validate
        const validationErrors = validateForm();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(values);
        } finally {
            setIsSubmitting(false);
        }
    }, [values, validateForm, onSubmit]);

    const setFieldValue = useCallback((field: keyof T, value: T[keyof T]) => {
        setValues(prev => ({ ...prev, [field]: value }));
    }, []);

    const setFieldError = useCallback((field: keyof T, error: string) => {
        setErrors(prev => ({ ...prev, [field]: error }));
    }, []);

    const reset = useCallback(() => {
        setValues(initialValues);
        setErrors({});
        setTouched({});
        setIsSubmitting(false);
    }, [initialValues]);

    return {
        values,
        errors,
        touched,
        isSubmitting,
        isValid,
        handleChange,
        handleBlur,
        handleSubmit,
        setFieldValue,
        setFieldError,
        reset,
    };
}

// ============================================================================
// FORM FIELD HELPERS
// ============================================================================

export function getFieldProps<T extends Record<string, unknown>>(
    form: UseFormReturn<T>,
    name: keyof T
) {
    return {
        name,
        value: form.values[name] as string,
        onChange: form.handleChange,
        onBlur: form.handleBlur,
        error: form.touched[name] && form.errors[name],
    };
}

export function getErrorMessage<T extends Record<string, unknown>>(
    form: UseFormReturn<T>,
    name: keyof T
): string | undefined {
    return form.touched[name] ? form.errors[name] : undefined;
}

// ============================================================================
// DEBOUNCED INPUT HOOK
// ============================================================================

export function useDebouncedValue<T>(value: T, delay: number = 300): T {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);

    return debouncedValue;
}
