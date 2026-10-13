/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    // Every text size scales with --text-scale (Settings → Text Size); spacing
    // and icons stay in plain rem. Values are Tailwind's defaults, plus 2xs/3xs
    // for the small caps labels that used to be fixed pixel sizes.
    fontSize: Object.fromEntries(
      Object.entries({
        '3xs': ['0.625rem', '0.875rem'],
        '2xs': ['0.6875rem', '1rem'],
        xs:   ['0.75rem', '1rem'],
        sm:   ['0.875rem', '1.25rem'],
        base: ['1rem', '1.5rem'],
        lg:   ['1.125rem', '1.75rem'],
        xl:   ['1.25rem', '1.75rem'],
        '2xl': ['1.5rem', '2rem'],
        '3xl': ['1.875rem', '2.25rem'],
        '4xl': ['2.25rem', '2.5rem'],
        '5xl': ['3rem', '1'],
        '6xl': ['3.75rem', '1'],
        '7xl': ['4.5rem', '1'],
        '8xl': ['6rem', '1'],
        '9xl': ['8rem', '1'],
      }).map(([key, [size, lineHeight]]) => [
        key,
        [
          `calc(${size} * var(--text-scale, 1))`,
          { lineHeight: lineHeight === '1' ? '1' : `calc(${lineHeight} * var(--text-scale, 1))` },
        ],
      ]),
    ),
    extend: {
      colors: {
        // 8Hope Brand Colors
        gold: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#C9A84C', // Primary gold
          600: '#b7932f',
          700: '#92710f',
          800: '#78590a',
          900: '#4d3a07',
        },
        hope: {
          blue:  '#1E3A5F', // Deep navy blue
          green: '#2D6A4F', // Sacred green
          gray:  '#4A4A4A', // Warm gray
          light: '#F8F6F0', // Warm off-white
          dark:  '#0F1C2E', // Night mode dark
        },
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
      },
      keyframes: {
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-up': {
          from: { opacity: 0, transform: 'translateY(24px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'accordion-down': {
          from: { height: 0 },
          to:   { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to:   { height: 0 },
        },
      },
      animation: {
        'fade-in':       'fade-in 0.4s ease-out',
        'slide-up':      'slide-up 0.5s ease-out',
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
