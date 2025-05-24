/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'var(--tw-prose-body)',
            p: {
              marginTop: '0.8em',
              marginBottom: '0.8em',
              lineHeight: '1.6',
            },
            strong: {
              fontWeight: '600',
              color: 'var(--tw-prose-bold)',
            },
            ul: {
              marginTop: '0.8em',
              marginBottom: '0.8em',
              paddingLeft: '1.6em',
              listStyleType: 'disc',
            },
            li: {
              marginTop: '0.2em',
              marginBottom: '0.2em',
            },
            code: {
              backgroundColor: 'rgb(var(--tw-prose-pre-bg))',
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '400',
            },
            'code::before': {
              content: 'none',
            },
            'code::after': {
              content: 'none',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
  darkMode: 'media'
} 