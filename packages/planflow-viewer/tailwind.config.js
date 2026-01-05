/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      zIndex: {
        '44': '44',
        '45': '45',
        '60': '60',
        '65': '65',
        '70': '70',
      },
    },
  },
}
