/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@radix-ui/react-*/**/*.{js,ts,jsx,tsx}", // Include Radix UI
  ],
  theme: {
    extend: {
      colors: {
        primary: "#F2CA50",
        secondary: "#784400",
        dark: "#261818",
        light: "#F2EEE9",
      },
    },
  },
  plugins: [],
};
