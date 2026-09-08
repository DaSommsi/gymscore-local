/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,js,ts,jsx,tsx}',
    './index.html',
    './src/renderer/**/*.{html,js,ts,jsx,tsx}',
    './src/helper-ui/**/*.{html,js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          bg: '#0f172a',        // slate-900
          card: '#1e293b',      // slate-800
          border: '#334155',    // slate-700
          accent: '#2563eb',    // blue-600
          success: '#16a34a',   // green-600
          warning: '#d97706',   // amber-600
          danger: '#dc2626'     // red-600
        }
      }
    }
  },
  plugins: []
};
