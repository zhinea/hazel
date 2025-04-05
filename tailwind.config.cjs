/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-', // Add your desired prefix here
  content: [
    './src/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('daisyui'),
  ],
}