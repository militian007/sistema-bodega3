/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['"Orbitron"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#05060b',
          900: '#0a0c14',
          800: '#0f1220',
          700: '#161a2c',
          600: '#1f2438',
          500: '#2a304a',
        },
        neon: {
          cyan: '#00f0ff',
          magenta: '#ff2bd6',
          green: '#39ff8b',
          yellow: '#ffe23a',
          purple: '#9b5cff',
          red: '#ff3b6b',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 12px rgba(0,240,255,0.6), 0 0 32px rgba(0,240,255,0.25)',
        'neon-magenta': '0 0 12px rgba(255,43,214,0.6), 0 0 32px rgba(255,43,214,0.25)',
        'neon-green': '0 0 12px rgba(57,255,139,0.6), 0 0 32px rgba(57,255,139,0.25)',
        'neon-red': '0 0 12px rgba(255,59,107,0.6), 0 0 32px rgba(255,59,107,0.25)',
        'neon-yellow': '0 0 12px rgba(255,226,58,0.6), 0 0 32px rgba(255,226,58,0.25)',
      },
      backgroundImage: {
        'grid-fade':
          'linear-gradient(rgba(0,240,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.06) 1px, transparent 1px)',
        'radial-cyan':
          'radial-gradient(circle at 20% 0%, rgba(0,240,255,0.10), transparent 40%), radial-gradient(circle at 80% 100%, rgba(255,43,214,0.10), transparent 40%)',
      },
      backgroundSize: {
        'grid-cell': '32px 32px',
      },
      keyframes: {
        flicker: {
          '0%,100%': { opacity: '1' },
          '45%': { opacity: '0.85' },
          '50%': { opacity: '0.4' },
          '55%': { opacity: '0.9' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseSlow: {
          '0%,100%': { boxShadow: '0 0 8px rgba(0,240,255,0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(0,240,255,0.8)' },
        },
      },
      animation: {
        flicker: 'flicker 4s infinite',
        scan: 'scan 6s linear infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
