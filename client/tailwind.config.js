/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff9752',
          dark:    '#e8833a',
        },
        secondary: '#0f172a',
        success:   '#22c55e',
        error:     '#ef4444',
        warning:   '#f59e0b',
        surface:   '#f7f7f7',
        container: '#ffffff',
        accent:    '#ff9752',
        'text-muted': '#0f172a',
      },
      fontFamily: {
        sans: ['sans-serif'],
      },
      fontSize: {
        'xs':  ['12px', { lineHeight: 'normal' }],
        'sm':  ['14px', { lineHeight: 'normal' }],
        'md':  ['15px', { lineHeight: 'normal' }],
        'lg':  ['16px', { lineHeight: 'normal' }],
        'xl':  ['22px', { lineHeight: 'normal' }],
        '2xl': ['26px', { lineHeight: 'normal' }],
        '3xl': ['42px', { lineHeight: 'normal' }],
        '4xl': ['60px', { lineHeight: 'normal' }],
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        card:  '0 1px 2px rgba(0,0,0,0.04), 0 2px 4px rgba(0,0,0,0.02), 0 4px 8px rgba(0,0,0,0.02)',
        modal: '0 0 0 0 rgba(0,0,0,0)',
      },
      borderRadius: {
        'custom': '28px',
        'pill':   '32px',
      },
      transitionDuration: {
        'instant': '150ms',
        'fast':    '200ms',
        'normal':  '300ms',
      },
    },
  },
  plugins: [],
}
