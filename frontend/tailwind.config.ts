import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Dynamic CSS variables - works with both themes
        background: 'var(--kc-bg)',
        surface: 'var(--kc-surface)',
        surface2: 'var(--kc-surface2)',
        
        // Borders
        border: 'var(--kc-border)',
        'border-light': 'var(--kc-border)',
        'border-focus': '#555555',
        
        // Text - High contrast
        'text-primary': 'var(--kc-text-primary)',
        'text-secondary': 'var(--kc-text-secondary)',
        'text-muted': 'var(--kc-text-muted)',
        
        // RGB Accents - using CSS variables
        'accent-red': 'var(--kc-accent-red)',
        'accent-green': 'var(--kc-accent-green)',
        'accent-blue': 'var(--kc-accent-blue)',
        
        // Legacy support
        success: 'var(--kc-accent-green)',
        warning: '#ffaa00',
        danger: 'var(--kc-accent-red)',
        info: 'var(--kc-accent-blue)',
        
        // Zinc fallbacks for dark mode
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
        950: '#09090b',
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
