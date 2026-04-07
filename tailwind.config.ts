import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          dark: "#070b14",
          navy: "#0b1120",
          accent: "#10b981",
        },
      },
    },
  },
  plugins: [],
};

export default config;
