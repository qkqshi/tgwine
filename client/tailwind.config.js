/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "apple-bg": "#f5f5f7",
        "apple-bg-elevated": "#ffffff",
        "apple-text": "#1d1d1f",
        "apple-text-secondary": "#6e6e73",
        "apple-text-tertiary": "#86868b",
        "apple-blue": "#0071e3",
        "apple-blue-hover": "#0077ed",
        "apple-green": "#34c759",
        "apple-orange": "#ff9500",
        "apple-red": "#ff3b30",
        "apple-purple": "#af52de",
      },
      borderRadius: {
        "apple-sm": "10px",
        "apple": "12px",
        "apple-lg": "16px",
        "apple-xl": "20px",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Display", "SF Pro Text", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
}
