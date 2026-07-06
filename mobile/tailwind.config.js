/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Matches the web frontend's brand green (frontend uses #006E3A).
        primary: '#006E3A',
      },
    },
  },
  plugins: [],
};
