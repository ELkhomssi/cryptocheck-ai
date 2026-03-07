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
      },
      animation: {
        grid: "gridShift 18s linear infinite",
      },
      keyframes: {
        gridShift: {
          "0%": { backgroundPosition: "0px 0px" },
          "100%": { backgroundPosition: "38px 38px" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
