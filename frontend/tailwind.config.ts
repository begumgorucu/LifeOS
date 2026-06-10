import type { Config } from "tailwindcss";
import animatePlugin from "tailwindcss-animate";

const config: Config = {
  // Dark mode driven by [data-theme="dark"] on <html> (set in index.html).
  // The 'class' fallback is kept so future theme toggles can flip a body class too.
  darkMode: ["class", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Surface tokens — wired to CSS variables so theming flips at the root.
        bg: {
          base: "hsl(var(--bg-base) / <alpha-value>)",
          surface: "hsl(var(--bg-surface) / <alpha-value>)",
          "surface-2": "hsl(var(--bg-surface-2) / <alpha-value>)",
        },
        fg: {
          primary: "hsl(var(--fg-primary) / <alpha-value>)",
          muted: "hsl(var(--fg-muted) / <alpha-value>)",
          subtle: "hsl(var(--fg-subtle) / <alpha-value>)",
        },
        // Domain accent palette — Studio Modern health scale.
        health: {
          excellent: "#5DCAA5",
          good: "#FFB85C",
          warning: "#F59E0B",
          critical: "#F87171",
        },
        // shadcn / Radix compat aliases — also driven by CSS variables.
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--border) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--bg-base) / <alpha-value>)",
        foreground: "hsl(var(--fg-primary) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--bg-surface) / <alpha-value>)",
          foreground: "hsl(var(--fg-primary) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--bg-surface) / <alpha-value>)",
          foreground: "hsl(var(--fg-muted) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--bg-surface) / <alpha-value>)",
          foreground: "hsl(var(--fg-primary) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "#F87171",
          foreground: "#0f0f12",
        },
        card: {
          DEFAULT: "hsl(var(--bg-surface) / <alpha-value>)",
          foreground: "hsl(var(--fg-primary) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--bg-surface) / <alpha-value>)",
          foreground: "hsl(var(--fg-primary) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: ['"Geist"', "system-ui", "-apple-system", "sans-serif"],
      },
      fontSize: {
        h1: ["22px", { letterSpacing: "-0.1px", lineHeight: "1.3" }],
        h2: ["18px", { letterSpacing: "-0.1px", lineHeight: "1.35" }],
        h3: ["16px", { letterSpacing: "-0.1px", lineHeight: "1.4" }],
        body: ["14px", { lineHeight: "1.5" }],
        meta: ["12px", { letterSpacing: "0.2px", lineHeight: "1.4" }],
        numeric: ["16px", { letterSpacing: "-0.5px", lineHeight: "1" }],
      },
      borderRadius: {
        card: "14px",
        badge: "10px",
        "badge-sm": "6px",
        // shadcn defaults reuse this scale so its primitives still feel right.
        lg: "14px",
        md: "10px",
        sm: "6px",
      },
      borderWidth: {
        hair: "0.5px",
      },
      transitionTimingFunction: {
        spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-soft": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        "250": "250ms",
      },
      keyframes: {
        "pulse-soft": {
          "0%, 100%": { borderColor: "rgba(248,113,113,0.35)" },
          "50%": { borderColor: "rgba(248,113,113,0.85)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "pulse-soft": "pulse-soft 2.5s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both",
      },
    },
  },
  plugins: [animatePlugin],
};

export default config;
