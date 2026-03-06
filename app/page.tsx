"use client";

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeuralScanner } from "@/components/NeuralScanner";
import LiveAlphaFeed from "@/components/LiveAlphaFeed";
import type { EngineResult } from "@/lib/engine";

// ─── Theme ───────────────────────────────────────────────────────────────────

const THEME = {
  bg:      "#030303",
  surface: "#080808",
  card:    "#0a0a0a",
  border:  "rgba(255,255,255,0.04)",
  gold:    "#00d4ff",
  emerald: "#00ff88",
  text:    "rgba(255,255,255,0.85)",
  muted:   "rgba(255,255,255,0.25)",
  dim:     "rgba(255,255,255,0.08)",
};

// ─── Topbar ──────────────────────────────────────────────────────────────────

interface TopbarProps {
  result: EngineResult | null;
  accent: string;
}

function Topbar({ result, accent }: TopbarProps) {
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const update = () =>
      setTime(new Date().toISOString().replace("T", " ").slice(0, 19) + " UTC");
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header
      className="flex items-center justify-between px-5 flex-shrink-0"
      style={{
        height: 44,
        background: THEME.surface,
        borderBottom: `0.5px solid ${THEME.border}`,
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <div
          className="relative w-5 h-5 rotate-45 border flex-shrink-0 flex items-center justify-center"
          style={{ borderColor: accent + "60", background: accent + "08" }}
        >
          <div className="w-1.5 h-1.5 rotate-45" style={{ background: accent + "80" }} />
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm font-bold tracking-tight" style={{ color: accent }}>
            CRYPTOCHECK
          </span>
          <span className="font-mono text-[10px] tracking-widest" style={{ color: THEME.muted }}>
            ALPHA TERMINAL
          </span>
        </div>
        <div className="w-px h-4" style={{ background: THEME.border }} />
        <div className="flex items-center gap-1.5">
          <motion.div
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: THEME.emerald, boxShadow: `0 0 4px ${THEME.emerald}` }}
          />
          <span className="font-mono text-[9px] tracking-widest" style={{ color: THEME.emerald + "80" }}>
            MAINNET
          </span>
        </div>
      </div>

      {/* Center summary */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-center gap-3 font-mono text-[10px]"
          >
            <span style={{ color: THEME.muted }}>LAST SCAN</span>
            <span style={{ color: THEME.text }}>{result.token.symbol}</span>
            <div className="w-px h-3" style={{ background: THEME.border }} />
            <span style={{ color: result.score >= 60 ? THEME.emerald : THEME.gold }}>
              SCORE {result.score}
            </span>
            <div className="w-px h-3" style={{ background: THEME.border }} />
            <span style={{ color: THEME.muted }}>{result.verdict}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right */}
      <div className="flex items-center gap-4 font-mono text-[9px]" style={{ color: THEME.muted }}>
        <span style={{ color: THEME.dim }}>{time}</span>
        <div className="flex gap-1.5 pl-2" style={{ borderLeft: `0.5px solid ${THEME.border}` }}>
          <a
            href="/upgrade"
            className="px-3 py-1 font-mono text-[9px] tracking-widest uppercase transition-all hover:opacity-80"
            style={{
              border: `0.5px solid ${accent}40`,
              color: accent,
              background: accent + "08",
              borderRadius: 1,
            }}
          >
            PRO
          </a>
        </div>
      </div>
    </header>
  );
}

// ─── Swap Panel ──────────────────────────────────────────────────────────────

interface SwapPanelProps {
  mint?: string;
  accent: string;
}

function SwapPanel({ mint, accent }: SwapPanelProps) {
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const existing = document.getElementById("jupiter-script");
    if (existing) return;

    const s = document.createElement("script");
    s.id = "jupiter-script";
    s.src = "https://terminal.jup.ag/main-v2.js";
    s.async = true;
    s.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Jupiter?.init({
        displayMode: "integrated",
        integratedTargetId: "jup-swap-container",
        endpoint: process.env.NEXT_PUBLIC_HELIUS_RPC_URL,
        platformFeeAndAccounts: {
          feeBps: 10,
          feeAccounts: new Map([
            ["So11111111111111111111111111111111111111112", process.env.NEXT_PUBLIC_FEE_SOL ?? ""],
          ]),
        },
        formProps: mint ? { initialOutputMint: mint, fixedOutputMint: true } : {},
      });
      setLoaded(true);
    };
    document.head.appendChild(s);
    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).Jupiter?.close?.();
    };
  }, [mint]);

  return (
    <div
      className="flex flex-col h-full"
      style={{ background: THEME.surface, border: `0.5px solid ${accent}18`, borderRadius: 2 }}
    >
      <div
        className="px-3 py-2.5 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: `0.5px solid ${THEME.border}` }}
      >
        <span className="font-mono text-[9px] tracking-[0.2em] uppercase" style={{ color: THEME.muted }}>
          QUICK EXECUTE
        </span>
        <span
          className="font-mono text-[8px] px-1.5 py-0.5"
          style={{ border: `0.5px solid ${accent}30`, color: accent + "60", background: accent + "06" }}
        >
          0.1% FEE
        </span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        {!loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3" style={{ color: THEME.muted }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
              className="w-6 h-6 rounded-full"
              style={{ border: `0.5px solid ${accent}20`, borderTopColor: accent }}
            />
            <span className="font-mono text-[9px] tracking-widest">LOADING JUPITER...</span>
          </div>
        )}
        <div id="jup-swap-container" className="h-full" />
      </div>

      <div className="px-3 py-2 flex-shrink-0" style={{ borderTop: `0.5px solid ${THEME.border}` }}>
        <span className="font-mono text-[8px] tracking-widest" style={{ color: THEME.dim }}>
          POWERED BY JUPITER AGGREGATOR
        </span>
      </div>
    </div>
  );
}

// ─── Status Bar ──────────────────────────────────────────────────────────────

function StatusBar({ result }: { result: EngineResult | null }) {
  return (
    <footer
      className="flex items-center justify-between px-5 flex-shrink-0"
      style={{ height: 28, background: THEME.surface, borderTop: `0.5px solid ${THEME.border}` }}
    >
      <div className="flex items-center gap-4 font-mono text-[8px] tracking-widest" style={{ color: THEME.dim }}>
        <span>CRYPTOCHECK.AI</span>
        <span>v2.0.0-STEALTH</span>
        <span>SOLANA MAINNET-BETA</span>
      </div>

      {result && (
        <div className="flex items-center gap-3 font-mono text-[8px]" style={{ color: THEME.dim }}>
          <span>LAST: {result.token.mint.slice(0, 16)}...</span>
          <span>·</span>
          <span>{result.token.fetchMs}ms</span>
          <span>·</span>
          <span>{new Date(result.analyzedAt).toLocaleTimeString()}</span>
        </div>
      )}

      <div className="flex items-center gap-2">
        {["AUTHORITY", "LIQUIDITY", "PATTERN"].map((label) => (
          <span
            key={label}
            className="font-mono text-[8px] px-2 py-0.5"
            style={{ border: `0.5px solid ${THEME.border}`, color: THEME.dim, background: "rgba(255,255,255,0.01)" }}
          >
            {label} ✓
          </span>
        ))}
      </div>
    </footer>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function MissionControlPage() {
  const [activeResult, setActiveResult] = useState<EngineResult | null>(null);
  const [activeMint, setActiveMint]     = useState<string | undefined>();
  const [accent, setAccent]             = useState<"gold" | "emerald">("gold");

  const accentColor = accent === "gold" ? THEME.gold : THEME.emerald;

  const handleFeedSelect = useCallback((mint: string) => {
    setActiveMint(mint);
  }, []);

  const handleFeedScan = useCallback((mint: string) => { setActiveMint(mint); }, []);

  const handleScanResult = useCallback((result: EngineResult) => {
    setActiveResult(result);
    setActiveMint(result.token.mint);
  }, []);

  return (
    <div
      className="flex flex-col"
      style={{ height: "100dvh", background: THEME.bg, overflow: "hidden", color: THEME.text }}
    >
      {/* Topbar */}
      <Topbar result={activeResult} accent={accentColor} />

      {/* Accent toggle dots */}
      <div className="absolute top-2.5 right-32 flex items-center gap-1 z-10">
        {(["gold", "emerald"] as const).map((a) => (
          <button
            key={a}
            onClick={() => setAccent(a)}
            className="w-3 h-3 rounded-full transition-all"
            style={{
              background: a === "gold" ? THEME.gold : THEME.emerald,
              opacity: accent === a ? 1 : 0.25,
              boxShadow: accent === a ? `0 0 6px ${a === "gold" ? THEME.gold : THEME.emerald}` : "none",
            }}
          />
        ))}
      </div>

      {/* 3-column grid */}
      <div className="flex flex-1 overflow-hidden" style={{ padding: "8px", gap: 8 }}>

        {/* LEFT — Live Feed */}
        <div className="flex-shrink-0 overflow-hidden" style={{ width: 272 }}>
          <LiveAlphaFeed accent={accentColor} onScan={handleFeedScan} />
        </div>

        {/* CENTER — Scanner */}
        <div className="flex-1 overflow-hidden">
          <NeuralScanner
            accent={accentColor}
            onResult={handleScanResult}
            initialMint={activeMint}
          />
        </div>

        {/* RIGHT — Swap */}
        <div className="flex-shrink-0 overflow-hidden" style={{ width: 252 }}>
          <SwapPanel mint={activeMint} accent={accentColor} />
        </div>

      </div>

      {/* Status bar */}
      <StatusBar result={activeResult} />
    </div>
  );
}
