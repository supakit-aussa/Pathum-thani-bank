/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e3f2fd',
          100: '#bbdefb',
          200: '#90caf9',
          300: '#64b5f6',
          400: '#42a5f5',
          500: '#2196f3',
          600: '#1e88e5',
          700: '#1976d2',
          800: '#1565c0',
          900: '#0d47a1',
        },
        bank: {
          primary: '#1565C0',
          secondary: '#0d47a1',
          accent: '#42a5f5',
          light: '#e3f2fd',
          dark: '#0a3069',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px rgba(21, 101, 192, 0.08)',
        'card-hover': '0 8px 24px rgba(21, 101, 192, 0.16)',
      },
    },
  },
  plugins: [],
};
