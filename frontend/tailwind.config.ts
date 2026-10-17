import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF7F5',
          100: '#F9ECE7',
          200: '#F2D4CC',
          300: '#E4AFA1',
          400: '#D27F6B',
          500: '#B84931', // Signature Ithi Pooram Terracotta
          600: '#9E341D',
          700: '#842614',
          800: '#6C2112',
          900: '#48170D',
        },
        slatepos: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#090D16',
        },
        leaf: {
          50: '#F2F9F4',
          100: '#E3F2E7',
          500: '#2E7D46',
          700: '#1E5830',
          900: '#13361E',
        },
        gold: {
          400: '#E5A93C',
          500: '#C88A1E',
          600: '#9E6811',
        },
        parchment: {
          50: '#FAF8F5',
          100: '#F5F1EA',
          200: '#EBE4D8',
          300: '#DCD1C0',
          400: '#C2B29D',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        malayalam: [
          '"Noto Sans Malayalam"',
          '"Manjari"',
          'sans-serif',
        ],
        mono: [
          '"JetBrains Mono"',
          '"Courier New"',
          'Courier',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};

export default config;
