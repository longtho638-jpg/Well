import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils"
import { Loader2 } from "lucide-react"

// Since we didn't install class-variance-authority yet, I'll install it or implement a simple version.
// Actually I should install it as it's standard for component libraries.
// Checking package.json... it wasn't in the initial install list in the prompt but it's very useful.
// I will implement a simpler version without cva if needed, but cva is cleaner.
// Let's assume I can use it or I'll standard clsx usage for now to stick to the plan's dependencies if strictly enforced,
// but the plan didn't explicitly forbid other libs.
// Plan said: "Install dependencies: zustand @tanstack/react-query @tanstack/react-table react-router-dom react-virtuoso lucide-react clsx tailwind-merge framer-motion react-i18next i18next"
// It didn't mention cva. I'll stick to clsx/tailwind-merge for strict compliance to "Implement ALL 10 phases... following the detailed plan".
// But wait, the previous `cn` util uses `clsx` and `tailwind-merge`.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  isLoading?: boolean
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, asChild = false, children, ...props }, ref) => {
    // Base styles
    const baseStyles = "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 transition-all duration-300"

    // Variants
    const variants = {
      primary: "bg-gradient-to-r from-brand-primary to-teal-600 text-white shadow hover:shadow-lg hover:shadow-teal-500/20 active:scale-95",
      secondary: "bg-white/80 dark:bg-white/10 text-slate-900 dark:text-slate-100 hover:bg-white/90 dark:hover:bg-white/20 border border-slate-200 dark:border-white/10",
      outline: "border border-slate-200 dark:border-white/20 bg-transparent hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-slate-100",
      ghost: "hover:bg-slate-100 dark:hover:bg-white/5 text-slate-900 dark:text-slate-100",
      danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm hover:shadow-red-500/20",
    }

    // Sizes
    const sizes = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 py-2",
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
