/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        sua: {
          50:  '#f0f7f0',
          100: '#d8eed8',
          200: '#b3dcb5',
          300: '#7fc483',
          400: '#4da854',
          500: '#2d8b34',
          600: '#1f6e26',
          700: '#1a5a20',
          800: '#17481c',
          900: '#133c18',
        },
        gold: {
          400: '#f5c842',
          500: '#e8b62a',
          600: '#c9991c',
        },
      },
      fontFamily: {
        sans: ['Inter var', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Lexend', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
