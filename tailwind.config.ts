import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0a0e14',
          panel: '#111820',
          elevated: '#1a232e',
        },
        border: {
          DEFAULT: '#1f2a37',
          bright: '#2a3a4d',
        },
        text: {
          DEFAULT: '#e4e9ef',
          muted: '#8a96a3',
          dim: '#5a6573',
        },
        accent: {
          DEFAULT: '#4ecdc4',
          hover: '#5eddd4',
          dim: '#2d8a85',
        },
        warn: '#f5a623',
        danger: '#e74c3c',
        success: '#4caf50',
      },
      fontFamily: {
        heading: ['Rajdhani', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
} satisfies Config
