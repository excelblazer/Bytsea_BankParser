import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./index.html",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px'
      }
    },
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))'
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' }
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' }
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      fontSize: {
        'responsive-xs': 'clamp(0.75rem, 2.5vw, 0.875rem)',
        'responsive-sm': 'clamp(0.875rem, 3vw, 1rem)',
        'responsive-base': 'clamp(1rem, 3.5vw, 1.125rem)',
        'responsive-lg': 'clamp(1.125rem, 4vw, 1.25rem)',
        'responsive-xl': 'clamp(1.25rem, 4.5vw, 1.5rem)',
        'responsive-2xl': 'clamp(1.5rem, 5vw, 2rem)',
        'responsive-3xl': 'clamp(2rem, 6vw, 3rem)',
        'responsive-4xl': 'clamp(2.5rem, 7vw, 4rem)',
      },
      animation: {
        'fade-in': 'fade-in var(--animation-duration-normal, 0.3s) ease-out forwards',
        'slide-up': 'slide-up var(--animation-duration-normal, 0.3s) ease-out forwards',
        'scale-in': 'scale-in var(--animation-duration-normal, 0.3s) ease-out forwards',
        'blob': 'blob 7s infinite',
        'blob-slow': 'blob-slow 10s infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse-slow 8s ease-in-out infinite',
      },
      animationDelay: {
        '100': '100ms',
        '200': '200ms',
        '300': '300ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1s',
        '2000': '2s',
      },
      supports: {
        'container-queries': 'container-type: inline-size',
      }
    }
  },
  plugins: [
    require("tailwindcss-animate"),
    function({ addUtilities }: { addUtilities: (utilities: Record<string, Record<string, string>>) => void }) {
      const containerQueries = {
        '.container-query': {
          'container-type': 'inline-size',
        },
        '.container-query-size': {
          'container-type': 'size',
        },
        '.container-query-normal': {
          'container-type': 'normal',
        },
      };
      addUtilities(containerQueries);
    }
  ],
};

export default config;
