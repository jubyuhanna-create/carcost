import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#07090f',
          surface: '#0e1420',
          elevated: '#151d2e',
        },
        border: {
          DEFAULT: '#1a2540',
          subtle: '#111927',
        },
        accent: {
          DEFAULT: '#f97316',
          muted: 'rgba(249,115,22,0.15)',
          hover: '#ea6c10',
        },
        text: {
          primary: '#e8edf5',
          muted: '#8896b0',
          faint: '#4a5568',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
        fuel: '#3b82f6',
        maintenance: '#a855f7',
        repairs: '#f97316',
        other: '#64748b',
      },
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        display: ['var(--font-sora)', 'sans-serif'],
      },
      borderRadius: {
        xl: '14px',
        '2xl': '20px',
        '3xl': '28px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        'accent-glow': '0 0 20px rgba(249,115,22,0.25)',
        'modal': '0 25px 60px rgba(0,0,0,0.7)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { transform: 'translateY(12px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideIn: { '0%': { transform: 'translateX(-8px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
      },
    },
  },
  plugins: [],
}
export default config
