import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        accent: '#2f6fed',
        'accent-soft': '#eaf1ff',
        border: '#d8e1ec',
        'border-strong': '#c2cedb',
        surface: '#ffffff',
        'surface-2': '#f8fafc',
        'surface-3': '#edf2f7',
        'text-base': '#18212b',
        muted: '#627286',
        'muted-2': '#455468',
        'muted-3': '#7b8a9a',
        'green-brand': '#1f9d55',
        'green-soft': '#edf8f2',
        'red-brand': '#c94b4b',
        'red-soft': '#fdeeee',
        'yellow-brand': '#b7791f',
        'yellow-soft': '#fff8e8',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(16,24,40,.04), 0 6px 18px rgba(16,24,40,.04)',
        md: '0 1px 2px rgba(16,24,40,.05), 0 14px 28px rgba(16,24,40,.06)',
        lg: '0 10px 40px rgba(16,24,40,.08)',
      },
      borderRadius: {
        xl: '14px',
        '2xl': '18px',
        '3xl': '24px',
      },
    },
  },
  plugins: [],
}
export default config
