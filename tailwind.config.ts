import type { Config } from 'tailwindcss';

// Brand palette is mirrored from sinaitaxi-esim-web with two
// automotive-leaning shifts:
//   • `brand-900` deepened slightly to read as "executive" navy
//     instead of the original nightsky used for the eSIM hero.
//   • A new `metal` scale for matte vehicle-card surfaces.
// The bright `brand-500` blue stays the primary CTA colour so the
// two products feel like the same family.
const config: Config = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#EEF3FF',
          100: '#DCE7FF',
          200: '#B9CFFF',
          300: '#8FB1FF',
          400: '#5388FF',
          500: '#1E5EFF',  // primary CTA — shared with eSIM
          600: '#1045D9',
          700: '#0E37AA',
          800: '#0E2D80',
          900: '#0A1A3F',  // deeper than eSIM's #0E1430 — executive navy for hourly
          950: '#06081A',
        },
        ink: {
          50:  '#F7F9FC',
          100: '#EEF2F8',
          200: '#E1E7F1',
          300: '#C7D0DF',
          400: '#9AA3B7',
          500: '#697186',
          600: '#4B5468',
          700: '#33394A',
          800: '#1C2030',
          900: '#0A0E1B',
        },
        accent: {
          400: '#FFC857',
          500: '#F5A623',
        },
        // Cool, matte greys for vehicle-card surfaces. Reads as
        // automotive showroom rather than fintech card.
        metal: {
          50:  '#F4F6F8',
          100: '#E5E9EE',
          200: '#CDD3DB',
          300: '#A6AEB9',
          400: '#7C8595',
          500: '#5C6573',
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
      letterSpacing: {
        tighter: '-0.04em',
        tightest: '-0.06em',
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        soft: '0 1px 2px rgba(11,15,30,0.04), 0 8px 24px rgba(11,15,30,0.06)',
        glow: '0 24px 60px -20px rgba(30,94,255,0.45)',
      },
      keyframes: {
        floaty: {
          '0%,100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
      },
      animation: {
        floaty: 'floaty 5s ease-in-out infinite',
      },
      backgroundImage: {
        // Road-stripe motif on the homepage hero (subtle).
        'road-fade':
          'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(30,94,255,0.18), transparent), linear-gradient(rgba(11,15,30,0.04) 1px, transparent 1px)',
      },
      backgroundSize: {
        'road-md': '60px 60px',
      },
    },
  },
  plugins: [],
};

export default config;
