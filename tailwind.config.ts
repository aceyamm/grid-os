/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#050B0A",
        "dark-green-black": "#091310",
        border: "#20312B",
        cream: "#E8E9E3",
        "gray-green": "#89938E",
        gold: "#C4A664",
        emerald: "#10B981",
        amber: "#F59E0B",
        crimson: "#DC2626",
      },
      fontFamily: {
        sans: ["Arial", "Helvetica", "sans-serif"],
        mono: ["monospace"],
      },
    },
  },
  plugins: [],
};

