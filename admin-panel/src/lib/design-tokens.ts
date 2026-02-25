/**
 * Aura Elite Design System Tokens
 * Shared constants for consistent UI across admin panel
 */

export const AURA_ELITE = {
  // Glassmorphism backgrounds
  glass: {
    light: 'bg-white/10 backdrop-blur-xl',
    medium: 'bg-white/20 backdrop-blur-2xl',
    strong: 'bg-white/30 backdrop-blur-3xl',
    dark: 'bg-black/20 backdrop-blur-xl',
  },

  // Gradient combinations
  gradients: {
    primary: 'bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400',
    secondary: 'bg-gradient-to-br from-blue-500 to-purple-600',
    success: 'bg-gradient-to-r from-green-400 to-emerald-500',
    warning: 'bg-gradient-to-r from-yellow-400 to-orange-500',
    danger: 'bg-gradient-to-r from-red-500 to-pink-600',
  },

  // Border styles
  borders: {
    default: 'border border-white/20',
    glow: 'border border-white/30 shadow-lg shadow-purple-500/20',
    strong: 'border-2 border-white/40',
  },

  // Shadow effects
  shadows: {
    sm: 'shadow-sm shadow-purple-500/10',
    md: 'shadow-lg shadow-purple-500/15',
    lg: 'shadow-2xl shadow-purple-500/25',
    glow: 'shadow-2xl shadow-purple-400/50',
  },

  // Animation classes
  animations: {
    fadeIn: 'animate-fadeIn',
    slideUp: 'animate-slideUp',
    slideDown: 'animate-slideDown',
    pulse: 'animate-pulse',
    spin: 'animate-spin',
  },

  // Spacing presets
  spacing: {
    card: 'p-6 rounded-2xl',
    section: 'space-y-6',
    stack: 'space-y-4',
    inline: 'space-x-4',
  },

  // Typography
  text: {
    heading: 'text-3xl font-bold bg-clip-text text-transparent',
    subheading: 'text-xl font-semibold text-white/90',
    body: 'text-base text-white/80',
    caption: 'text-sm text-white/60',
  },
} as const

export type AuraTheme = typeof AURA_ELITE
