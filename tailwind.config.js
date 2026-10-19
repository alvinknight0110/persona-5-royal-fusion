/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        p5red: '#e60012',
        p5dark: '#0c0c0f',
        p5gold: '#ffd700',
      }
    },
  },
  plugins: [],
}
