/**
 * Vibe UI SDK — Entry Point
 *
 * Re-exports UI components + typed interfaces for RaaS projects.
 * Components use Aura Elite design system (glassmorphism, dark gradients).
 *
 * Usage:
 *   import { Button, Input, Modal } from '@/lib/vibe-ui';
 *   import type { VibeButtonProps, VibeModalProps } from '@/lib/vibe-ui';
 */

// Re-export types (provider-agnostic, reusable across projects)
export type {
  ButtonVariant,
  ButtonSize,
  VibeButtonProps,
  VibeInputProps,
  ModalMaxWidth,
  VibeModalProps,
  VibeSelectOption,
  VibeSelectProps,
  ToastType,
  VibeToast,
  VibeToastContext,
  VibeSkeletonProps,
} from './types';

// Re-export components (project-specific implementations)
export { Button } from '@/components/ui/Button';
export { Input } from '@/components/ui/Input';
export { Modal } from '@/components/ui/Modal';
export { Select } from '@/components/ui/Select';
export { ToastProvider, useToast } from '@/components/ui/Toast';
export { Skeleton } from '@/components/ui/Skeleton';
export { ErrorBoundary } from '@/components/ui/ErrorBoundary';
export { SuccessAnimation } from '@/components/ui/SuccessAnimation';
