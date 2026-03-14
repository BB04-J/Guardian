import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      colors: {
        // Base
        canvas:  "#080c14",
        surface: "#0d1424",
        panel:   "#111827",
        border:  "#1e2d45",
        // Accents
        critical: { DEFAULT: "#ef4444", muted: "#3b1212", text: "#fca5a5" },
        high:     { DEFAULT: "#f97316", muted: "#3b1a0a", text: "#fdba74" },
        medium:   { DEFAULT: "#eab308", muted: "#2d2507", text: "#fde047" },
        low:      { DEFAULT: "#22c55e", muted: "#0d2b1a", text: "#86efac" },
        safe:     { DEFAULT: "#3b82f6", muted: "#0f1f3b", text: "#93c5fd" },
        // UI
        cyan:  { DEFAULT: "#06b6d4", dim: "#0891b2" },
        slate: {
          750: "#1e2d45",
          850: "#0f1929",
          950: "#060d18",
        },
      },
      backgroundImage: {
        "grid-faint": "linear-gradient(rgba(30,45,69,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(30,45,69,0.4) 1px, transparent 1px)",
        "scan-line": "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(6,182,212,0.015) 2px, rgba(6,182,212,0.015) 4px)",
      },
      backgroundSize: {
        "grid-faint": "40px 40px",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "fade-in":    "fadeIn 0.4s ease forwards",
        "slide-in":   "slideIn 0.3s ease forwards",
        "blink":      "blink 1.2s step-end infinite",
      },
      keyframes: {
        fadeIn:  { from: { opacity: "0", transform: "translateY(6px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        slideIn: { from: { opacity: "0", transform: "translateX(-8px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        blink:   { "0%,100%": { opacity: "1" }, "50%": { opacity: "0" } },
      },
      boxShadow: {
        "glass":    "0 0 0 1px rgba(30,45,69,0.8), 0 4px 24px rgba(0,0,0,0.4)",
        "glow-red": "0 0 20px rgba(239,68,68,0.25)",
        "glow-cyn": "0 0 20px rgba(6,182,212,0.2)",
        "inner-top": "inset 0 1px 0 rgba(255,255,255,0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
