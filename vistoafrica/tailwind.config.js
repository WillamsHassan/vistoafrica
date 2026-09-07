/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1F8A5B',
          greenDeep: '#136B48',
          greenSoft: '#EAF7F1',
          red: '#D94B3D',
          redSoft: '#FCEAE7',
          cream: '#F7F6F1',
          ivory: '#FFFFFF',
          dark: '#12211D',
          darkSoft: '#2D3B38',
          slate: '#EDF2F1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px rgba(18, 33, 29, 0.08)',
        card: '0 12px 28px rgba(18, 33, 29, 0.08)',
        glow: '0 20px 40px rgba(31, 138, 91, 0.18)',
      },
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      spacing: {
        18: '4.5rem',
      },
    },
  },
  plugins: [],
}
