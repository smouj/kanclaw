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
        // Base colors - Premium monochrome
        background: '#050505',
        surface: '#0a0a0a',
        surface2: '#111111',
        surface3: '#181818',
        
        // Borders - Subtle
        border: '#222222',
        'border-light': '#333333',
        'border-focus': '#555555',
        
        // Text
        'text-primary': '#ffffff',
        'text-secondary': '#b0b0b0',
        'text-muted': '#666666',
        
        // RGB Accents
        accent: {
          red: '#ff3333',
          green: '#33ff33',
          blue: '#3333ff',
          // RGB variants
          'red-dark': '#cc0000',
          'green-dark': '#00cc00',
          'blue-dark': '#0000cc',
          // Glow variants
          'red-glow': 'rgba(255, 51, 51, 0.5)',
          'green-glow': 'rgba(51, 255, 51, 0.5)',
          'blue-glow': 'rgba(51, 51, 255, 0.5)',
        },
        
        // Legacy support
        success: '#33ff33',
        warning: '#ffaa00',
        danger: '#ff3333',
        info: '#3333ff',
      },
      borderRadius: {
        // Sharp/minimal corners - almost 0
        DEFAULT: '2px',
        none: '0px',
        xs: '1px',
        sm: '2px',
        md: '3px',
        lg: '4px',
      },
      boxShadow: {
        panel: '0 0 0 1px rgba(255,255,255,0.06), 0 8px 32px rgba(0,0,0,0.5)',
        'panel-hover': '0 0 0 1px rgba(255,255,255,0.12), 0 12px 48px rgba(0,0,0,0.6)',
        glow: {
          red: '0 0 20px rgba(255, 51, 51, 0.4)',
          green: '0 0 20px rgba(51, 255, 51, 0.4)',
          blue: '0 0 20px rgba(51, 51, 255, 0.4)',
        },
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        rise: 'rise 300ms ease forwards',
        pulse: 'pulse 2s ease-in-out infinite',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};

export default config;
