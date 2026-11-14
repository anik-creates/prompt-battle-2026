/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#06070a',
          900: '#0a0d14',
          850: '#0e121b',
          800: '#141a26',
          700: '#1e2638',
          600: '#2c374d',
        },
        fest: {
          pink: '#ff007a',
          cyan: '#00e5ff',
          blue: '#0084ff',
          amber: '#ffb700',
          pes: '#6cb33f',
        }
      },
      fontFamily: {
        sans: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowPulse: {
          '0%': { boxShadow: '0 0 15px rgba(0, 229, 255, 0.2)' },
          '100%': { boxShadow: '0 0 25px rgba(255, 0, 122, 0.35)' },
        }
      }
    },
  },
  plugins: [],
}
