// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,jsx,ts,tsx}",
    "./src/templates/**/*.{js,jsx,ts,tsx}", // Important: Add templates
    "./src/components/**/*.{js,jsx,ts,tsx}", // Add if you create components later
  ],
  theme: {
    extend: {},
  },
  plugins: [require("@tailwindcss/typography")],
};
