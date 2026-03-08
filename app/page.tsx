"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeuralScanner } from "@/components/NeuralScanner";
import LiveAlphaFeed from "@/components/LiveAlphaFeed";
import type { EngineResult } from "@/lib/engine";

const THEME = {
  bg: "#030303", surface: "#080808", border: "rgba(255,255,255,0.04)",
  gold: "#ffb300", emerald: "#00ff88", blue: "#00d4ff",
  text: "rgba(255,255,255,0.85)", muted: "rgba(255,255,255,0.25)", dim: "rgba(255,255,255,0.08)",
};

function Topbar({ result, accent }: { result: EngineResult | null; accent: string }) {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => setTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header style={{ height: 44, background: THEME.surface, borderBottom: "0.5px solid " + THEME.border, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", flexShrink: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 20, height: 20, transform: "rotate(45deg)", border: "1px solid " + accent + "60", background: accent + "08", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 6, height: 6, transform: "rotate(45deg)", background: accent }} />
        </div>
        <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: accent, letterSpacing: "0.05em" }}>CRYPTOCHECK</span>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: THEME.muted, letterSpacing: "0.2em" }}>ALPHA TERMINAL</span>
        <div style={{ width: 1, height: 16, background: THEME.border }} />
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <motion.div animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 2 }}
            style={{ width: 6, height: 6, borderRadius: "50%", background: THEME.emerald, boxShadow: "0 0 6px " + THEME.emerald }} />
          <span style={{ fontFamily: "monospace", fontSize: 9, color: THEME.emerald, letterSpacing: "0.15em" }}>MAINNET</span>
        </div>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: "monospace", fontSize: 10 }}>
            <span style={{ color: THEME.muted }}>LAST SCAN</span>
            <span style={{ color: THEME.text }}>{result.token.symbol}</span>
            <span style={{ color: result.score >= 60 ? THEME.emerald : THEME.gold }}>SCORE {result.score}</span>
            <span style={{ color: THEME.muted }}>{result.verdict}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <span style={{ fontFamily: "monospace", fontSize: 9, color: THEME.dim }}>{time}</span>
        <a href="/robot" style={{ padding: "4px 12px", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", border: "0.5px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.4)", background: "transparent", borderRadius: 2, textDecoration: "none", marginRight: 6 }}>ROBOT</a><a href="/upgrade" style={{ padding: "4px 12px", fontFamily: "monospace", fontSize: 9, letterSpacing: "0.15em", border: "0.5px solid " + accent + "40", color: accent, background: accent + "08", borderRadius: 2, textDecoration: "none" }}>PRO</a>
      </div>
    </header>
  );
}

export default function Page() {
  const [activeResult, setActiveResult] = useState<EngineResult | null>(null);
  const [activeMint, setActiveMint] = useState<string | undefined>();
  const [accent, setAccent] = useState<"blue" | "gold" | "emerald">("blue");
  const accentColor = accent === "blue" ? THEME.blue : accent === "gold" ? THEME.gold : THEME.emerald;

  const handleFeedScan = useCallback((mint: string) => { setActiveMint(mint); }, []);
  const handleScanResult = useCallback((result: EngineResult) => { setActiveResult(result); setActiveMint(result.token.mint); }, []);

  return (
    <div style={{ height: "100dvh", background: THEME.bg, display: "flex", flexDirection: "column", overflow: "hidden", color: THEME.text }}>
      <Topbar result={activeResult} accent={accentColor} />

      {/* Accent toggle */}
      <div style={{ position: "absolute", top: 12, right: 80, display: "flex", gap: 6, zIndex: 10 }}>
        {(["blue", "gold", "emerald"] as const).map(a => (
          <button key={a} onClick={() => setAccent(a)} style={{ width: 10, height: 10, borderRadius: "50%", background: a === "blue" ? THEME.blue : a === "gold" ? THEME.gold : THEME.emerald, opacity: accent === a ? 1 : 0.25, border: "none", cursor: "pointer", boxShadow: accent === a ? "0 0 8px currentColor" : "none" }} />
        ))}
      </div>

      {/* 3-column layout */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", padding: 8, gap: 8 }}>
        {/* LEFT — Alpha Feed */}
        <div style={{ width: 240, flexShrink: 0, overflow: "hidden" }}>
          <LiveAlphaFeed accent={accentColor} onScan={handleFeedScan} />
        </div>

        {/* CENTER — Neural Scanner */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          <NeuralScanner accent={accentColor} onResult={handleScanResult} initialMint={activeMint} />
        </div>

        {/* RIGHT — Jupiter Swap */}
        <div style={{ width: 260, flexShrink: 0, background: THEME.surface, border: "0.5px solid " + accentColor + "18", borderRadius: 4, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 12px", borderBottom: "0.5px solid " + THEME.border, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", fontSize: 9, color: THEME.muted, letterSpacing: "0.2em" }}>QUICK EXECUTE</span>
            <span style={{ fontFamily: "monospace", fontSize: 8, color: accentColor + "80", border: "0.5px solid " + accentColor + "30", padding: "1px 6px" }}>0.1% FEE</span>
          </div>
          <div style={{ flex: 1, overflow: "hidden" }}>
            <SwapPanel mint={activeMint} accent={accentColor} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <footer style={{ height: 26, background: THEME.surface, borderTop: "0.5px solid " + THEME.border, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px" }}>
        <div style={{ display: "flex", gap: 16, fontFamily: "monospace", fontSize: 8, color: THEME.dim }}>
          <span>CRYPTOCHECK.AI</span><span>v2.0.0</span><span>SOLANA MAINNET</span>
        </div>
        {activeResult && (
          <span style={{ fontFamily: "monospace", fontSize: 8, color: THEME.dim }}>
            LAST: {activeResult.token.mint.slice(0, 16)}... · {activeResult.token.fetchMs}ms
          </span>
        )}
        <div style={{ display: "flex", gap: 6 }}>
          {["AUTHORITY", "LIQUIDITY", "PATTERN"].map(l => (
            <span key={l} style={{ fontFamily: "monospace", fontSize: 7, color: THEME.dim, border: "0.5px solid " + THEME.border, padding: "1px 6px" }}>{l} ✓</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

function SwapPanel({ mint, accent }: { mint?: string; accent: string }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (document.getElementById("jupiter-script")) return;
    const s = document.createElement("script");
    s.id = "jupiter-script"; s.src = "https://terminal.jup.ag/main-v2.js"; s.async = true;
    s.onload = () => {
      (window as any).Jupiter?.init({ displayMode: "integrated", integratedTargetId: "jup-swap-container", endpoint: process.env.NEXT_PUBLIC_HELIUS_RPC_URL, formProps: mint ? { initialOutputMint: mint, fixedOutputMint: true } : {} });
      setLoaded(true);
    };
    document.head.appendChild(s);
  }, [mint]);
  return (
    <div style={{ height: "100%", position: "relative" }}>
      {!loaded && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, color: "rgba(255,255,255,0.2)" }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
            style={{ width: 20, height: 20, borderRadius: "50%", border: "1px solid " + accent + "30", borderTopColor: accent }} />
          <span style={{ fontFamily: "monospace", fontSize: 8, letterSpacing: "0.1em" }}>LOADING JUPITER...</span>
        </div>
      )}
      <div id="jup-swap-container" style={{ height: "100%" }} />
    </div>
  );
}
