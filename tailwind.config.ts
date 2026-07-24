import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'SF Pro Text',
          'Inter', 'Helvetica Neue', 'sans-serif',
        ],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        // Cool paper-grey base, matching the reference comp.
        ink: {
          50: '#f4f6f7',
          100: '#e6eaec',
          200: '#cbd3d6',
          300: '#a6b2b7',
          400: '#78878d',
          600: '#3f4a4f',
          800: '#1c2427',
          900: '#0f1416',
        },
        // Muted sage, used for focus rings, links and the live-run indicator.
        sage: { DEFAULT: '#6f9187', deep: '#4d6a62' },
        accent: { DEFAULT: '#222b2e', hover: '#111819' },
        warn: '#a8843c', danger: '#a8322a',
      },
      letterSpacing: { tightest: '-0.022em' },
      boxShadow: {
        soft: '0 1px 3px rgba(20,30,33,0.04), 0 4px 12px rgba(20,30,33,0.05)',
        panel: '0 1px 0 rgba(255,255,255,0.8) inset, 0 12px 40px rgba(20,30,33,0.07)',
        terminal: '0 18px 50px rgba(15,20,22,0.28)',
      },
      keyframes: {
        pulseDot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
      },
      animation: { 'pulse-dot': 'pulseDot 1.8s ease-in-out infinite' },
    },
  },
  plugins: [],
};

export default config;
