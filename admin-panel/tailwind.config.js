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
        display: [
          '"Manrope"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
        sans: [
          '"Plus Jakarta Sans"',
          'system-ui',
          '-apple-system',
          'sans-serif',
        ],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}
