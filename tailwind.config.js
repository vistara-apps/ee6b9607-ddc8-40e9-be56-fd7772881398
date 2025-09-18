/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(220 10% 15%)',
        accent: 'hsl(160 100% 40%)',
        primary: 'hsl(210 100% 50%)',
        surface: 'hsl(220 10% 20%)',
        'text-primary': 'hsl(0 0% 95%)',
        'text-secondary': 'hsl(0 0% 70%)',
      },
      borderRadius: {
        'xs': '4px',
        'sm': '6px',
        'md': '10px',
        'lg': '16px',
        'xl': '24px',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '12px',
        'lg': '16px',
        'xl': '24px',
      },
      boxShadow: {
        'card': '0 4px 16px hsla(0, 0%, 0%, 0.1)',
        'modal': '0 20px 48px hsla(0, 0%, 0%, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.2, 1) infinite',
      },
      transitionTimingFunction: {
        'custom': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
      },
    },
  },
  plugins: [],
}
