const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: ['class'],
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
        secondary: ['Rajdhani', ...defaultTheme.fontFamily.sans],
        mono: ['JetBrains Mono', ...defaultTheme.fontFamily.mono]
      },
      colors: {
        background: 'hsl(0 0% 2%)',
        foreground: 'hsl(0 0% 98%)',
        card: 'hsl(0 0% 4%)',
        'card-foreground': 'hsl(0 0% 98%)',
        popover: 'hsl(0 0% 4%)',
        'popover-foreground': 'hsl(0 0% 98%)',
        primary: 'hsl(343 81% 50%)',
        'primary-foreground': 'hsl(0 0% 98%)',
        secondary: 'hsl(240 4% 16%)',
        'secondary-foreground': 'hsl(0 0% 98%)',
        muted: 'hsl(240 4% 16%)',
        'muted-foreground': 'hsl(240 5% 65%)',
        accent: 'hsl(240 4% 16%)',
        'accent-foreground': 'hsl(0 0% 98%)',
        destructive: 'hsl(0 63% 31%)',
        'destructive-foreground': 'hsl(0 0% 98%)',
        border: 'hsl(240 4% 16%)',
        input: 'hsl(240 4% 16%)',
        ring: 'hsl(343 81% 50%)'
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      }
    }
  },
  plugins: [require('tailwindcss-animate')]
};