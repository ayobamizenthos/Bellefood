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
      },
      animation: {
        'fade-in': 'fade-in 250ms ease-out',
        'slide-up': 'slide-up 250ms ease-out',
      },
    },
  },
  plugins: [],
}

export default config
