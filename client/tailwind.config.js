/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  important: true,
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@radix-ui/react-*/**/*.{js,ts,jsx,tsx}", // Include Radix UI
  ],
  safelist: ["data-[state=active]:bg-dark", "data-[state=active]:text-primary"],
  theme: {
    extend: {
      colors: {
        ...colors,
        primary: "#F2CA50",
        secondary: "#b29662",
        dark: "#080808",
        light: "#F2EEE9",
      },
    },
  },
  plugins: [],
};
