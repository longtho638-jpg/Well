import React from 'react';
import { motion } from 'framer-motion';

// ===== BUTTON COMPONENTS =====

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
    variant = 'primary',
    size = 'md',
    children,
    className = '',
    ...props
}) => {
    const sizeClasses = {
        sm: 'px-4 py-2 text-sm',
        md: 'px-6 py-3 text-base',
        lg: 'px-8 py-4 text-lg'
    };

    const variantClasses = {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        ghost: 'text-slate-700 hover:bg-slate-100 rounded-lg transition-colors duration-200'
    };

    return (
        <button
            className={`${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

// ===== CARD COMPONENTS =====

interface CardProps {
    glass?: boolean;
    hover?: boolean;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
    glass = false,
    hover = false,
    children,
    className = '',
    onClick
}) => {
    const baseClasses = glass
        ? 'glass-card p-6'
        : 'bg-white rounded-2xl p-6 shadow-lg border border-slate-200';

    const hoverClasses = hover ? 'hover-lift cursor-pointer' : '';

    return (
        <motion.div
            className={`${baseClasses} ${hoverClasses} ${className}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
            onClick={onClick}
        >
            {children}
        </motion.div>
    );
};

// ===== GRADIENT TEXT =====

interface GradientTextProps {
    children: React.ReactNode;
    className?: string;
}

export const GradientText: React.FC<GradientTextProps> = ({ children, className = '' }) => {
    return (
        <span className={`gradient-text ${className}`}>
            {children}
        </span>
    );
};

// ===== INPUT FIELD =====

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
    label,
    error,
    className = '',
    ...props
}) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-slate-700 mb-2">
                    {label}
                </label>
            )}
            <input
                className={`input-field ${error ? 'border-red-500' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};

// ===== SECTION CONTAINER =====

interface SectionProps {
    children: React.ReactNode;
    className?: string;
    background?: 'light' | 'dark' | 'gradient';
}

export const Section: React.FC<SectionProps> = ({
    children,
    className = '',
    background = 'light'
}) => {
    const bgClasses = {
        light: 'bg-white',
        dark: 'bg-slate-900 text-white',
        gradient: 'bg-gradient-to-br from-teal-50 to-violet-50'
    };

    return (
        <section className={`py-20 px-6 ${bgClasses[background]} ${className}`}>
            <div className="max-w-7xl mx-auto">
                {children}
            </div>
        </section>
    );
};

// ===== CONTAINER =====

export const Container: React.FC<{ children: React.ReactNode; className?: string }> = ({
    children,
    className = ''
}) => {
    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${className}`}>
            {children}
        </div>
    );
};

// ===== SKELETON LOADER =====

interface SkeletonProps {
    width?: string;
    height?: string;
    className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
    width = '100%',
    height = '1rem',
    className = ''
}) => {
    return (
        <div
            className={`skeleton ${className}`}
            style={{ width, height }}
        />
    );
};
