/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#edfaf5',
          100: '#d3f4e5',
          200: '#aae8cf',
          300: '#72d5b3',
          400: '#3aba93',
          500: '#1a9d7a',
          600: '#0f7d62',
          700: '#0d6451',
          800: '#0d5044',
          900: '#0c4239',
        },
      },
    },
  },
  plugins: [],
};
