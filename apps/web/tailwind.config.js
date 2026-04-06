/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        muted: 'hsl(var(--muted))',
        'muted-foreground': 'hsl(var(--muted-foreground))',
        primary: 'hsl(var(--primary))',
        'primary-foreground': 'hsl(var(--primary-foreground))',
        card: 'hsl(var(--card))',
        accent: 'hsl(var(--accent))',
        sidebar: 'hsl(var(--sidebar))',
        'sidebar-foreground': 'hsl(var(--sidebar-foreground))',
        'sidebar-muted': 'hsl(var(--sidebar-muted))',
        'sidebar-border': 'hsl(var(--sidebar-border))',
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        danger: 'hsl(var(--danger))',
      },
      borderRadius: {
        lg: 'var(--radius-lg)',
        md: 'var(--radius-md)',
        sm: 'var(--radius-sm)',
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)',
        'card-hover': '0 10px 25px -5px rgb(15 23 42 / 0.08), 0 4px 10px -6px rgb(15 23 42 / 0.06)',
        glow: '0 0 40px -10px hsl(221 83% 53% / 0.35)',
      },
      backgroundImage: {
        'mesh-gradient':
          'radial-gradient(at 40% 20%, hsl(221 83% 53% / 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, hsl(262 83% 58% / 0.08) 0px, transparent 50%), radial-gradient(at 0% 50%, hsl(199 89% 48% / 0.06) 0px, transparent 50%)',
      },
    },
  },
  plugins: [],
};
