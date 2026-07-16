/** @type {import('tailwindcss').Config} */
export default {
  presets: [require('@bharatsales/ui/tailwind.config')],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
