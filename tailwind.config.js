/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1e40af",
        secondary: "#3b82f6",
        accent: "#60a5fa",
        background: "#f8fafc",
        error: "#ef4444",
      },
    },
  },
  plugins: [],
};
