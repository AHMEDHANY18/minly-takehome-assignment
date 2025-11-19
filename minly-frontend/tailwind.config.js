// tailwind.config.js أو tailwind.config.ts
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class", // ⭐ مهم: نستخدم الـ class (html.dark)
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-main": "var(--bg-main)",
        "bg-card": "var(--bg-card)",
        "bg-field": "var(--bg-field)",
        "bg-avatar": "var(--bg-avatar)",
        "bg-stat": "var(--bg-stat)",
        "bg-soft": "var(--bg-soft)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-label": "var(--text-label)",

        "brand-purple": "var(--brand-purple)",

        "border-light": "var(--border-light)",
        "border-soft": "var(--border-soft)",
        "border-section": "var(--border-section)",
      },
    },
  },
  plugins: [],
};
