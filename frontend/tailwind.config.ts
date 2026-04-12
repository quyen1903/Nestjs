/** @type {import('tailwindcss').Config} */
export default {
  content: [
    ./app/**/*.{js,ts,jsx,tsx,mdx},
    './components/**/*.{js,ts,jsx,tsx,mdx},
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#10b981',
      },
      spacing: {
        128: '32rem',
      },
    },
  },
  plugins: [],
};
