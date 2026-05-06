/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        mahogany:  { DEFAULT: '#2C1810', light: '#3D2218' },
        parchment: { DEFAULT: '#F7F3ED', dark: '#EDE8E0' },
        copper:    { DEFAULT: '#B87333', light: '#D4924A', dark: '#8A5520' },
        stone:     {
          100: '#F5F0E8', 200: '#E8DDD0', 300: '#D4C4B0',
          400: '#A89880', 500: '#8B7355', 600: '#6B5540',
          700: '#4A3828', 800: '#2C1810', 900: '#1A0E08',
        },
        ivory: '#FFFFFF',
        alert: { red: '#C0392B', amber: '#B87333', green: '#27AE60' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        card:    '0 1px 4px rgba(44,24,16,0.05)',
        panel:   '0 4px 20px rgba(44,24,16,0.10)',
        copper:  '0 0 0 2px rgba(184,115,51,0.3)',
        lift:    '0 8px 24px rgba(44,24,16,0.12)',
      },
      borderRadius: {
        sm: '4px', DEFAULT: '6px', md: '8px', lg: '10px', xl: '16px',
      },
    },
  },
  plugins: [],
}
