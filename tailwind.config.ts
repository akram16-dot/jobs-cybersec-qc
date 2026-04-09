import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        // Palette sombre raffinée, slate-navy plutôt que noir pur
        ink: {
          950: "#05070d",
          900: "#0a0e1a",
          850: "#0e1320",
          800: "#121827",
          700: "#1a2233",
          600: "#263046",
        },
        accent: {
          DEFAULT: "#10b981",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
        },
        // Conservé pour compat
        brand: {
          dark: "#0a0e1a",
          navy: "#0e1320",
          accent: "#10b981",
        },
      },
      boxShadow: {
        "glow-accent":
          "0 0 0 1px rgba(16,185,129,0.35), 0 8px 32px -8px rgba(16,185,129,0.25)",
        card: "0 1px 0 0 rgba(255,255,255,0.04) inset, 0 24px 48px -24px rgba(0,0,0,0.6)",
      },
      letterSpacing: {
        tightest: "-0.035em",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
