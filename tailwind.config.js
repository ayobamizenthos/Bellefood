/** @type {import('tailwindcss').Config} */
const config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#F67C2B',
          bright: '#FF8B3D',
          dark: '#E0661A',
          tint: '#FEF1E8',
        },
        ink: {
          DEFAULT: '#1A1A1A',
          muted: '#666666',
        },
        line: '#E5E5E5',
        success: '#1E8E4E',
        danger: '#C62828',
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'Inter',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
      },
      fontSize: {
        label: ['0.75rem', { lineHeight: '1rem' }],
        body: ['0.875rem', { lineHeight: '1.5' }],
        lg: ['1rem', { lineHeight: '1.5' }],
      },
      maxWidth: {
        app: '480px',
        shell: '1200px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(26,26,26,0.06), 0 1px 2px rgba(26,26,26,0.04)',
        pop: '0 8px 30px rgba(26,26,26,0.12)',
      },
      transitionDuration: {
        250: '250ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.7)' },
          '60%': { opacity: '1', transform: 'scale(1.06)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'check-pop': {
          '0%': { transform: 'scale(0)' },
          '70%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'ring-out': {
          '0%': { opacity: '0.5', transform: 'scale(0.8)' },
          '100%': { opacity: '0', transform: 'scale(1.9)' },
        },
        'logo-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.1)' },
        },
        'progress-slide': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(400%)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
        'pop-in': 'pop-in 420ms cubic-bezier(0.16, 1, 0.3, 1)',
        'check-pop': 'check-pop 520ms 130ms cubic-bezier(0.16, 1, 0.3, 1) both',
        'ring-out': 'ring-out 900ms 200ms ease-out both',
        'logo-pulse': 'logo-pulse 1.1s ease-in-out infinite',
        'progress-slide': 'progress-slide 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
