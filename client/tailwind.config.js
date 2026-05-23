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
          DEFAULT: '#3b82f6',
          dark:    '#2563eb',
        },
        secondary: '#64748b',
        success:   '#22c55e',
        error:     '#ef4444',
        warning:   '#f59e0b',
        surface:   '#f9f9ff',
        container: '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        card:  '0 1px 2px 0 rgba(0,0,0,0.05)',
        modal: '0 4px 6px -1px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        'custom': '8px',
      },
    },
  },
  plugins: [],
}
