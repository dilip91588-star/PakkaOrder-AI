/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface-base": "#0b0f19",
        "surface-panel": "#111827",
        "surface-elevated": "#1e293b",
        "border-crisp": "#334155",
        "border-subtle": "#1f293d",
        "accent-cyan": "#06b6d4",
        "accent-cyan-hover": "#0891b2",
        "accent-cyan-subtle": "rgba(6, 182, 212, 0.12)",
        "accent-teal": "#14b8a6",
        "status-critical": "#ef4444",
        "status-critical-bg": "rgba(239, 68, 68, 0.12)",
        "status-warning": "#f59e0b",
        "status-warning-bg": "rgba(245, 158, 11, 0.12)",
        "status-success": "#10b981",
        "status-success-bg": "rgba(16, 185, 129, 0.12)",
        "status-neutral": "#64748b",
        "on-surface": "#dfe2f1",
        "on-surface-variant": "#94a3b8",
        "on-surface-muted": "#64748b",
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
