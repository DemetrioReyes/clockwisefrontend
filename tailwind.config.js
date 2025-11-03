/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2c3e50',
        secondary: '#3498db',
        accent: '#e74c3c',
        success: '#2ecc71',
        warning: '#f39c12',
        danger: '#e74c3c',
      },
    },
  },
  plugins: [],
}
