import { ReactNode } from 'react'
import { AURA_ELITE } from '../../lib/design-tokens'
import { cn } from '../../lib/utils'
import { Loader2 } from 'lucide-react'

interface AuraButtonProps {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

/**
 * Aura Elite Button Component
 * Gradient buttons with loading states and accessibility
 */
export function AuraButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className,
  onClick,
  type = 'button',
}: AuraButtonProps) {
  const baseStyles = cn(
    'rounded-xl font-semibold transition-all duration-300',
    'focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-gray-900',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    !disabled && !loading && 'hover:scale-105 active:scale-95'
  )

  const variantStyles = {
    primary: cn(AURA_ELITE.gradients.primary, AURA_ELITE.shadows.md, 'text-white'),
    secondary: cn(AURA_ELITE.gradients.secondary, AURA_ELITE.shadows.md, 'text-white'),
    success: cn(AURA_ELITE.gradients.success, AURA_ELITE.shadows.sm, 'text-white'),
    danger: cn(AURA_ELITE.gradients.danger, AURA_ELITE.shadows.sm, 'text-white'),
    ghost: 'bg-transparent border border-white/20 text-white/80 hover:bg-white/10',
  }

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  }

  return (
    <button
      type={type}
      className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <Loader2 className="inline-block w-4 h-4 mr-2 animate-spin" />}
      {children}
    </button>
  )
}
