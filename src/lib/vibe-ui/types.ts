/**
 * Vibe UI SDK — Shared Component Types
 *
 * Provider-agnostic type definitions for RaaS UI components.
 * Reusable across projects without coupling to specific design system.
 */

import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// ─── Button ─────────────────────────────────────────────────────

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface VibeButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

// ─── Input ──────────────────────────────────────────────────────

export interface VibeInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: ReactNode;
}

// ─── Modal ──────────────────────────────────────────────────────

export type ModalMaxWidth = 'sm' | 'md' | 'lg' | 'xl';

export interface VibeModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: ModalMaxWidth;
  showCloseButton?: boolean;
}

// ─── Select ─────────────────────────────────────────────────────

export interface VibeSelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface VibeSelectProps {
  label?: string;
  options: VibeSelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
}

// ─── Toast ──────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface VibeToast {
  id: string;
  message: string;
  type: ToastType;
}

export interface VibeToastContext {
  showToast: (message: string, type?: ToastType) => void;
}

// ─── Skeleton ───────────────────────────────────────────────────

export interface VibeSkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  count?: number;
}
