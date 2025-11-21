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
        // Dùng Manrope cho các tiêu đề với fallback stack mạnh cho Tiếng Việt
        display: [
          '"Manrope"',
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
        // Dùng Plus Jakarta Sans cho nội dung với fallback stack mạnh
        sans: [
          '"Plus Jakarta Sans"',
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
      }
    },
  },
  plugins: [],
}