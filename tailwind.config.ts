import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Dark mode color palette
        background: '#0a0a0a',
        foreground: '#fafafa',
        muted: '#27272a',
        accent: '#3b82f6',
      },
    },
  },
  plugins: [],
}
export default config
