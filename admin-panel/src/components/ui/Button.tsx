import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"
import { AURA_ELITE } from "../../lib/design-tokens"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

/**
 * Button Component - Enhanced with Aura Elite Design System
 * Gradient buttons with loading states and accessibility
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, asChild = false, children, ...props }, ref) => {
    // Base styles
    const baseStyles = cn(
      "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all duration-300",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900",
      "disabled:pointer-events-none disabled:opacity-50",
      !props.disabled && !isLoading && "hover:scale-105 active:scale-95"
    )

    // Variants with Aura Elite gradients
    const variants = {
      primary: cn(AURA_ELITE.gradients.primary, AURA_ELITE.shadows.md, "text-white"),
      secondary: cn(AURA_ELITE.gradients.secondary, AURA_ELITE.shadows.md, "text-white"),
      success: cn(AURA_ELITE.gradients.success, AURA_ELITE.shadows.sm, "text-white"),
      danger: cn(AURA_ELITE.gradients.danger, AURA_ELITE.shadows.sm, "text-white"),
      outline: "border border-white/20 bg-transparent hover:bg-white/5 text-white/80",
      ghost: "hover:bg-white/5 text-white/80",
    }

    // Sizes
    const sizes = {
      sm: "h-8 px-4 text-xs",
      md: "h-10 px-6 py-2",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10",
    }

    const Comp = asChild ? Slot : "button"

    if (asChild) {
      return (
        <Slot
          className={cn(baseStyles, variants[variant], sizes[size], className)}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    )
  }
)
Button.displayName = "Button"

export { Button }
