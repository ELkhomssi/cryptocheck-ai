import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#050816",
        panel: "rgba(10, 14, 32, 0.62)",
        panelStrong: "rgba(12, 18, 40, 0.82)",
        cyan: "#67e8f9",
        cyan2: "#22d3ee",
        blueGlow: "#60a5fa",
        neonGreen: "#22c55e",
        neonRed: "#ef4444",
        neonViolet: "#8b5cf6",
        neonPink: "#ec4899",
        line: "rgba(103, 232, 249, 0.18)",
      },
      backgroundImage: {
        "cyber-grid": `
          linear-gradient(rgba(103,232,249,0.08) 1px, transparent 1px),
          linear-gradient(90deg, rgba(103,232,249,0.08) 1px, transparent 1px),
          radial-gradient(circle at 20% 20%, rgba(34,211,238,0.12), transparent 28%),
          radial-gradient(circle at 80% 0%, rgba(139,92,246,0.10), transparent 30%),
          linear-gradient(180deg, #040611 0%, #070b1b 45%, #040611 100%)
        `,
        "crt-noise": `
          radial-gradient(rgba(255,255,255,0.05) 0.6px, transparent 0.6px),
          radial-gradient(rgba(103,232,249,0.03) 0.6px, transparent 0.6px)
        `,
        "scanlines": `
          repeating-linear-gradient(
            to bottom,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 2px,
            transparent 4px
          )
        `,
      },
      backgroundSize: {
        grid: "38px 38px, 38px 38px, auto, auto, auto",
        noise: "7px 7px, 11px 11px",
      },
      boxShadow: {
        cyber: "0 0 0 1px rgba(103,232,249,0.16), 0 10px 30px rgba(0,0,0,0.35), 0 0 35px rgba(34,211,238,0.12)",
        "cyber-strong":
          "0 0 0 1px rgba(103,232,249,0.22), 0 18px 40px rgba(0,0,0,0.42), 0 0 45px rgba(34,211,238,0.18), inset 0 0 28px rgba(255,255,255,0.03)",
        glow: "0 0 12px rgba(34,211,238,0.45), 0 0 36px rgba(34,211,238,0.20)",
        "glow-green": "0 0 14px rgba(34,197,94,0.45), 0 0 36px rgba(34,197,94,0.18)",
        "glow-red": "0 0 14px rgba(239,68,68,0.45), 0 0 36px rgba(239,68,68,0.18)",
      },
      keyframes: {
        gridShift: {
          "0%": { backgroundPosition: "0px 0px, 0px 0px, 0% 0%, 100% 0%, 0% 0%" },
          "100%": { backgroundPosition: "38px 38px, 38px 38px, 10% 5%, 90% 4%, 0% 100%" },
        },
        scanlineMove: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "0.98" },
          "10%": { opacity: "0.93" },
          "20%": { opacity: "0.99" },
          "35%": { opacity: "0.95" },
          "50%": { opacity: "1" },
          "70%": { opacity: "0.96" },
          "85%": { opacity: "0.99" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 0 rgba(34,211,238,0)" },
          "50%": { boxShadow: "0 0 18px rgba(34,211,238,0.28)" },
        },
        priceUpFlash: {
          "0%": { transform: "scale(1)", color: "#e5f9ff" },
          "30%": { transform: "scale(1.08)", color: "#22c55e" },
          "100%": { transform: "scale(1)", color: "#e5f9ff" },
        },
        priceDownFlash: {
          "0%": { transform: "scale(1)", color: "#e5f9ff" },
          "30%": { transform: "scale(1.08)", color: "#ef4444" },
          "100%": { transform: "scale(1)", color: "#e5f9ff" },
        },
        glitch: {
          "0%, 100%": { transform: "translate(0)" },
          "20%": { transform: "translate(-1px, 1px)" },
          "40%": { transform: "translate(1px, -1px)" },
          "60%": { transform: "translate(-1px, 0)" },
          "80%": { transform: "translate(1px, 0)" },
        },
        burst: {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "15%": { opacity: "0.95" },
          "100%": { transform: "scale(2.2)", opacity: "0" },
        },
        floatFab: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-4px)" },
        },
      },
      animation: {
        grid: "gridShift 18s linear infinite",
        scanline: "scanlineMove 7s linear infinite",
        flicker: "flicker 4s steps(10) infinite",
        pulseGlow: "glowPulse 2.6s ease-in-out infinite",
        priceUp: "priceUpFlash 650ms ease-out",
        priceDown: "priceDownFlash 650ms ease-out",
        glitch: "glitch 180ms linear",
        burst: "burst 800ms ease-out forwards",
        fab: "floatFab 2.2s ease-in-out infinite",
      },
      borderRadius: {
        "2xl": "1.25rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
    },
  },
  plugins: [],
} satisfies Config;
