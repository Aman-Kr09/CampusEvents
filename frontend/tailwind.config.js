/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#090a0f',        // Extremely deep space blue/black
        darkCard: '#11131c',      // Dark card obsidian
        glassBg: 'rgba(17, 19, 28, 0.6)', // Translucent dark
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        accentPurple: '#818cf8',  // Indigo/purple glow
        accentCyan: '#22d3ee',    // Cyan cyan glow
        accentPink: '#f472b6',    // Hot pink highlight
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 15px rgba(99, 102, 241, 0.25)',
        cyanGlow: '0 0 15px rgba(34, 211, 238, 0.25)',
        premium: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
