/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s infinite linear',
      },
      backgroundImage: {
        'shimmer-gradient': 'linear-gradient(90deg, rgba(39, 39, 42, 0) 0%, rgba(39, 39, 42, 0.2) 50%, rgba(39, 39, 42, 0) 100%)',
      },
    },
  },
  plugins: [],
}; 