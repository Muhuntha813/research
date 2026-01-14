/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: '#eef7ff',
          100: '#d8efff',
          200: '#b6e0ff',
          300: '#89cdff',
          400: '#5db7ff',
          500: '#2a9df4',
          600: '#1f79c5',
          700: '#165796',
          800: '#0e3a67',
          900: '#07243f',
        },
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0,0,0,0.08)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}