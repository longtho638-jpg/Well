/** @type {import('tailwindcss').Config} */
export default {
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
      },
      fontFamily: {
        // Default sans-serif - Plus Jakarta Sans for body text
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        // Display font - Outfit for headlines and hero text
        display: ['"Outfit"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
}