/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          900: "#0A192F",
          800: "#0F2744",
          700: "#1E3A8A",
          600: "#2563EB",
          50: "#F0F5FA"
        },
        energy: {
          teal: "#0D9488",
          emerald: "#059669",
          green: "#10B981",
          amber: "#D97706",
          orange: "#EA580C"
        }
      }
    },
  },
  plugins: [],
}
