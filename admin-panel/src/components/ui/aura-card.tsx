import { ReactNode } from 'react'
import { AURA_ELITE } from '../../lib/design-tokens'
import { cn } from '../../lib/utils'

interface AuraCardProps {
  children: ReactNode
  variant?: 'glass' | 'solid' | 'gradient'
  glow?: boolean
  className?: string
  onClick?: () => void
}

/**
 * Aura Elite Card Component
 * Glassmorphism card with optional gradient and glow effects
 */
export function AuraCard({
  children,
  variant = 'glass',
  glow = false,
  className,
  onClick,
}: AuraCardProps) {
  const baseStyles = cn(
    AURA_ELITE.spacing.card,
    'rounded-2xl transition-all duration-300',
    onClick && 'cursor-pointer hover:scale-[1.02]'
  )

  const variantStyles = {
    glass: cn(AURA_ELITE.glass.medium, AURA_ELITE.borders.default),
    solid: 'bg-gray-900/90 border border-white/10',
    gradient: cn(AURA_ELITE.gradients.primary, 'text-white'),
  }

  const shadowStyles = glow ? AURA_ELITE.shadows.glow : AURA_ELITE.shadows.md

  return (
    <div
      className={cn(baseStyles, variantStyles[variant], shadowStyles, className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  )
}
