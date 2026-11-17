/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        arena: {
          bg: '#09090b',
          panel: '#111114',
          card: '#18181b',
          'card-hover': '#202024',
          border: '#27272a',
          'border-subtle': '#1e1e22',
          accent: '#2563eb',
          'accent-hover': '#1d4ed8',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
          llm: '#6366f1',
          tool: '#0284c7',
          decision: '#0d9488',
          retry: '#d97706'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
};
