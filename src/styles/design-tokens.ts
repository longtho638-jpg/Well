/**
 * Design Tokens - Single Source of Truth
 * Synchronized with tailwind.config.js
 * All UI components should use these tokens
 */

export const designTokens = {
  // ===== PRIMARY BRAND COLORS =====
  colors: {
    brand: {
      primary: '#00575A', // Deep Teal
      accent: '#FFBF00',  // Marigold
      surface: '#FFFFFF',
      bg: '#F3F4F6',
    },
    
    // ===== DARK MODE COLORS =====
    dark: {
      bg: '#0F172A',        // Dark background (slate-900)
      surface: '#1E293B',   // Card background (slate-800)
      border: '#334155',    // Border color (slate-700)
      text: {
        primary: '#F1F5F9',   // Primary text (slate-100)
        secondary: '#CBD5E1', // Secondary text (slate-300)
        muted: '#94A3B8',     // Muted text (slate-400)
      }
    },

    // ===== SEMANTIC COLORS =====
    semantic: {
      success: '#22C55E',
      warning: '#EAB308',
      error: '#EF4444',
      info: '#3B82F6',
    },

    // ===== SECONDARY ACCENTS =====
    accents: {
      cyan: '#06b6d4',
      emerald: '#10b981',
      violet: '#8b5cf6',
      pink: '#ec4899',
      amber: '#f59e0b',
    }
  },

  // ===== SPACING =====
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
  },

  // ===== BORDER RADIUS =====
  radius: {
    sm: '8px',
    md: '16px',
    lg: '24px',
    full: '9999px',
  },

  // ===== TYPOGRAPHY =====
  typography: {
    fontFamily: {
      display: '"Outfit", system-ui, -apple-system, sans-serif',
      sans: '"Inter", system-ui, -apple-system, sans-serif',
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '32px',
      '4xl': '40px',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      black: 800,
    }
  },

  // ===== SHADOWS =====
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },

  // ===== ANIMATION/EASING =====
  animation: {
    easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
      slower: '700ms',
    }
  },

  // ===== GLOWS & EFFECTS =====
  effects: {
    glows: {
      primary: '0 0 20px rgba(0, 87, 90, 0.3)',
      accent: '0 0 20px rgba(255, 191, 0, 0.3)',
      cyan: '0 0 20px rgba(6, 182, 212, 0.3)',
    },
    gradients: {
      aura: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
      glow: 'radial-gradient(circle at center, rgba(0, 87, 90, 0.15) 0%, transparent 70%)',
      text: 'linear-gradient(to right, #00575A, #FFBF00)',
      border: 'linear-gradient(to bottom right, rgba(0, 87, 90, 0.5), rgba(255, 191, 0, 0.3))',
    }
  }
} as const;

/**
 * Helper function to get color from design tokens
 */
type NestedValue = string | number | { [key: string]: NestedValue };

export function getColor(path: string): string {
  const keys = path.split('.');
  let value: NestedValue = designTokens as NestedValue;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return '#000000';
    }
  }

  return typeof value === 'string' ? value : '#000000';
}

export default designTokens;
