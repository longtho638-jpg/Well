/**
 * Chart Card - Aura Elite Design System
 * Reusable wrapper for analytics charts
 */

import { cn } from '@/lib/utils'

interface ChartCardProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function ChartCard({ title, description, children, className }: ChartCardProps) {
  return (
    <div className={cn(
      'relative p-6 rounded-2xl border border-white/10 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm',
      'hover:border-white/20 transition-all duration-300',
      className
    )}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      {children}

      {/* Glassmorphism glow */}
      <div className="absolute -inset-px rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-r from-white/5 via-white/5 to-white/5 blur-sm" />
    </div>
  )
}
