import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#09090b',
        panel: '#111114',
        panel2: '#18181c',
        line: '#25252b',
        text: '#f4f4f5',
        muted: '#a1a1aa',
        accent: '#d4d4d8',
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444'
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(255,255,255,0.05), 0 20px 80px rgba(0,0,0,0.4)',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        rise: 'rise 500ms ease forwards',
      },
      fontFamily: {
        sans: ['var(--font-space-grotesk)'],
        mono: ['var(--font-ibm-plex-mono)'],
      },
    },
  },
  plugins: [],
};

export default config;