import * as React from "react"
import { cn } from "../../lib/utils"
import { AURA_ELITE } from "../../lib/design-tokens"

/**
 * GlassCard - Enhanced with Aura Elite Design System
 * Glassmorphism card with gradient and hover effects
 */
const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
    hoverEffect?: boolean
    glow?: boolean
  }
>(({ className, gradient = false, hoverEffect = false, glow = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-2xl border transition-all duration-300",
      // Aura Elite glassmorphism
      AURA_ELITE.glass.medium,
      AURA_ELITE.borders.default,

      gradient && "bg-gradient-to-br from-white/30 to-white/10 dark:from-zinc-900/60 dark:to-zinc-900/20",

      hoverEffect && "hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-purple-500/20 dark:hover:border-purple-500/30",

      glow && AURA_ELITE.shadows.glow,

      className
    )}
    {...props}
  />
))
GlassCard.displayName = "GlassCard"

export { GlassCard }
