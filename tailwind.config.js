/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#00575A', // Deep Teal
          accent: '#FFBF00',  // Marigold
          bg: '#F3F4F6',      // Off-white Background
          dark: '#1F2937',    // Text Main
          surface: '#FFFFFF',
        },
        // Aliases for deeper customization
        deepTeal: '#00575A',
        marigold: '#FFBF00',
        // Dark mode colors
        dark: {
          bg: '#0F172A',        // Dark background (slate-900)
          surface: '#1E293B',   // Card background (slate-800)
          border: '#334155',    // Border color (slate-700)
          text: {
            primary: '#F1F5F9',   // Primary text (slate-100)
            secondary: '#CBD5E1', // Secondary text (slate-300)
            muted: '#94A3B8',     // Muted text (slate-400)
          }
        }
      },
      fontFamily: {
        // Aura Elite: Outfit for headings with Vietnamese support
        display: [
          '"Outfit"',
          // Vietnamese-friendly fallbacks
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ],
        // Aura Elite: Inter for body text with Vietnamese support
        sans: [
          '"Inter"',
          // Vietnamese-friendly fallbacks
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          '"Helvetica Neue"',
          'Arial',
          '"Noto Sans"',
          'sans-serif',
          '"Apple Color Emoji"',
          '"Segoe UI Emoji"',
          '"Segoe UI Symbol"',
          '"Noto Color Emoji"'
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        'float': 'float 6s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundSize: {
        '300%': '300% 300%',
      }
    },
  },
  plugins: [],
}