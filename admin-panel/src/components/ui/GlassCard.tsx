import * as React from "react"
import { cn } from "../../lib/utils"

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    gradient?: boolean
    hoverEffect?: boolean
  }
>(({ className, gradient = false, hoverEffect = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border transition-all duration-300",
      // Light mode
      "bg-white/70 border-white/40 shadow-sm",
      // Dark mode (Aura Elite)
      "dark:bg-zinc-900/40 dark:backdrop-blur-md dark:border-white/5",

      gradient && "dark:bg-gradient-to-br dark:from-zinc-900/60 dark:to-zinc-900/20",

      hoverEffect && "hover:shadow-lg hover:-translate-y-1 dark:hover:shadow-teal-500/5 dark:hover:border-teal-500/20",

      className
    )}
    {...props}
  />
))
GlassCard.displayName = "GlassCard"

export { GlassCard }
