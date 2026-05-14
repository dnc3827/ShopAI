/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#3b82f6",
        secondary: "#64748b",
        surface: "#f9f9ff",
        success: "#22c55e",
        error: "#ef4444",
        warning: "#f59e0b",
      },
      borderRadius: {
        'custom': '8px',
      },
    },
  },
  plugins: [],
}
