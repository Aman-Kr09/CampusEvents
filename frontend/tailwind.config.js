/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        oceanBg: '#F6FBFF',
        oceanSurface: '#FFFFFF',
        oceanPrimary: '#0891B2',
        oceanSecondary: '#0EA5E9',
        oceanAccent: '#14B8A6',
        oceanText: '#0F172A',
        oceanBorder: '#D6EAF8',
        // Theme Aliases mapped to Ocean Breeze
        darkBg: '#F6FBFF',
        darkCard: '#FFFFFF',
        glassBg: 'rgba(255, 255, 255, 0.9)',
        glassBorder: '#D6EAF8',
        accentPurple: '#0891B2',
        accentCyan: '#0EA5E9',
        accentPink: '#14B8A6',
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 4px 20px rgba(8, 145, 178, 0.15)',
        cyanGlow: '0 4px 20px rgba(14, 165, 233, 0.15)',
        premium: '0 10px 30px -5px rgba(8, 145, 178, 0.08), 0 4px 6px -2px rgba(0, 0, 0, 0.03)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
