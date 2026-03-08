"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Phase = "idle" | "scanning" | "result";
type RiskLevel = "safe" | "warning" | "danger";

interface ScanResult {
  verdict: string;
  score: number;
  label: string;
  risk: RiskLevel;
  price: string;
  mcap: string;
  liquidity: string;
  holders: string;
  mintAuth: string;
  freezeAuth: string;
}

const SCAN_LOGS = [
  "Initializing neural scan engine v4.2.1...",
  "Resolving mint address on Solana mainnet...",
  "Fetching on-chain metadata...",
  "Checking token program ownership...",
  "Analyzing liquidity pool depth...",
  "Scanning holder distribution (top 100)...",
  "Detecting freeze/mint authority flags...",
  "Running rug-pull pattern recognition...",
  "Cross-referencing blacklist databases...",
  "Evaluating contract bytecode anomalies...",
  "Computing risk entropy score...",
  "Generating neural verdict...",
];

const RESULTS: Record<RiskLevel, ScanResult> = {
  safe: {
    verdict: "SAFE", score: 91, label: "LOW RISK", risk: "safe",
    price: "$0.0842", mcap: "$84.2M", liquidity: "$3.1M",
    holders: "12,440", mintAuth: "Revoked", freezeAuth: "Revoked",
  },
  warning: {
    verdict: "CAUTION", score: 54, label: "MEDIUM RISK", risk: "warning",
    price: "$0.00031", mcap: "$310K", liquidity: "$42K",
    holders: "834", mintAuth: "Active", freezeAuth: "Revoked",
  },
  danger: {
    verdict: "DANGER", score: 12, label: "HIGH RISK", risk: "danger",
    price: "$0.000002", mcap: "$2K", liquidity: "$800",
    holders: "67", mintAuth: "Active", freezeAuth: "Active",
  },
};

const RISK_COLORS: Record<RiskLevel, string> = {
  safe: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
};

function pickResult(addr: string): ScanResult {
  const s = addr.toLowerCase();
  if (s.includes("rug") || s.includes("scam") || s.includes("fake")) return RESULTS.danger;
  if (s.includes("warn") || s.includes("mid") || s.includes("sus")) return RESULTS.warning;
  return RESULTS.safe;
}

function GridBackground() {
  return (
    <>
      <style>{`
        @keyframes gridScroll {
          from { background-position: 0 0; }
          to   { background-position: 40px 40px; }
        }
        .grid-bg {
          background-image:
            linear-gradient(rgba(103,232,249,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(103,232,249,0.04) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: gridScroll 20s linear infinite;
        }
        .scanline-overlay {
          position: fixed; inset: 0; z-index: 1; pointer-events: none;
          background: repeating-linear-gradient(
            0deg, transparent, transparent 2px,
            rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px
          );
        }
        @keyframes glowPulse {
          0%,100% { box-shadow: 0 0 12px rgba(103,232,249,0.3); }
          50%      { box-shadow: 0 0 28px rgba(103,232,249,0.6); }
        }
        .glow-pulse { animation: glowPulse 3s ease-in-out infinite; }
        input::placeholder { color: rgba(103,232,249,0.3); }
        input:focus { outline: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: rgba(103,232,249,0.3); border-radius: 4px; }
      `}</style>
      <div className="grid-bg fixed inset-0 z-0" />
      <div className="scanline-overlay" />
    </>
  );
}

function ScoreGauge({ score, color }: { score: number; color: string }) {
  const [displayed, setDisplayed] = useState(0);
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;

  useEffect(() => {
    setDisplayed(0);
    let cur = 0;
    let raf: number;
    const tick = () => {
      cur = Math.min(cur + 2, score);
      setDisplayed(cur);
      if (cur < score) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  const offset = circ - (displayed / 100) * circ;

  return (
    <div className="relative flex-shrink-0" style={{ width: 128, height: 128 }}>
      <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.04s linear", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1 }}>
          {displayed}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>/100</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "#67e8f9" }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      background: "rgba(103,232,249,0.04)",
      border: "1px solid rgba(103,232,249,0.12)",
      borderRadius: 10, padding: "12px 16px",
      backdropFilter: "blur(8px)", flex: 1, minWidth: 90,
    }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function AuthBadge({ label, value }: { label: string; value: string }) {
  const ok = value === "Revoked";
  return (
    <div style={{
      background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 8, padding: "8px 12px",
    }}>
      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", letterSpacing: 1 }}>{label}</div>
      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, fontFamily: "monospace", color: ok ? "#22c55e" : "#ef4444" }}>
        {ok ? "✓ " : "✗ "}{value}
      </div>
    </div>
  );
}

function LogLine({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.2 }}
      style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(103,232,249,0.85)", padding: "2px 0", display: "flex", alignItems: "center", gap: 8 }}
    >
      <span style={{ color: "#22c55e", fontSize: 10 }}>▶</span>
      {text}
    </motion.div>
  );
}

export default function RobotPage() {
  const [addr, setAddr] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<ScanResult | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const runScan = () => {
    if (!addr.trim() || phase === "scanning") return;
    setPhase("scanning");
    setLogs([]);
    setResult(null);
    SCAN_LOGS.forEach((log, i) => setTimeout(() => setLogs(p => [...p, log]), i * 230));
    setTimeout(() => { setResult(pickResult(addr.trim())); setPhase("result"); }, SCAN_LOGS.length * 230 + 400);
  };

  const reset = () => { setPhase("idle"); setAddr(""); setLogs([]); setResult(null); };
  const riskColor = result ? RISK_COLORS[result.risk] : "#67e8f9";

  return (
    <main style={{ minHeight: "100vh", background: "#050816", color: "#fff", position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 48px" }}>
      <GridBackground />

      <div style={{ position: "relative", zIndex: 10, width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: "rgba(103,232,249,0.6)", marginBottom: 8, fontFamily: "monospace" }}>
            NEURAL SECURITY ENGINE v4.2
          </div>
          <h1 style={{
            fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, margin: 0, fontFamily: "monospace", letterSpacing: 2,
            background: "linear-gradient(135deg,#67e8f9,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>
            CryptoCheck AI
          </h1>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 6, fontFamily: "monospace" }}>
            Solana Token Risk Intelligence Platform
          </div>
        </div>

        {/* Search Terminal */}
        <div className="glow-pulse" style={{ background: "rgba(103,232,249,0.04)", border: "1px solid rgba(103,232,249,0.2)", borderRadius: 14, padding: 20, backdropFilter: "blur(16px)" }}>
          <div style={{ fontSize: 11, color: "#67e8f9", letterSpacing: 3, marginBottom: 12, fontFamily: "monospace" }}>◈ NEURAL VERDICT TERMINAL</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              value={addr}
              onChange={e => setAddr(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runScan()}
              placeholder="Enter Solana mint address..."
              style={{ flex: 1, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(103,232,249,0.2)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontFamily: "monospace", fontSize: 13 }}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={runScan}
              disabled={phase === "scanning" || !addr.trim()}
              style={{
                background: phase === "scanning" ? "rgba(103,232,249,0.1)" : "linear-gradient(135deg,#67e8f9,#06b6d4)",
                border: "none", borderRadius: 8, padding: "10px 20px",
                color: phase === "scanning" ? "#67e8f9" : "#050816",
                fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                cursor: phase === "scanning" ? "not-allowed" : "pointer",
                letterSpacing: 1, whiteSpace: "nowrap",
              }}
            >
              {phase === "scanning" ? "SCANNING..." : "⚡ ANALYZE"}
            </motion.button>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8, fontFamily: "monospace" }}>
            TIP: type "rug" → Danger · "warn" → Caution · anything else → Safe
          </div>
        </div>

        {/* Analysis Feed */}
        <AnimatePresence>
          {(phase === "scanning" || phase === "result") && (
            <motion.div key="feed" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(103,232,249,0.12)", borderRadius: 14, padding: 20, backdropFilter: "blur(12px)" }}>
              <div style={{ fontSize: 11, color: "#67e8f9", letterSpacing: 3, marginBottom: 12, fontFamily: "monospace" }}>◈ ANALYSIS FEED</div>
              <div ref={logRef} style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {logs.map((l, i) => <LogLine key={i} text={l} />)}
                {phase === "scanning" && (
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }}
                    style={{ color: "#67e8f9", fontFamily: "monospace", fontSize: 12, marginTop: 4 }}>▌</motion.span>
                )}
                {phase === "result" && (
                  <div style={{ color: "#22c55e", fontFamily: "monospace", fontSize: 12, marginTop: 4 }}>✓ Scan complete.</div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Panel */}
        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* Verdict + Gauge */}
              <div style={{
                background: "rgba(0,0,0,0.55)", border: `1px solid ${riskColor}44`,
                borderRadius: 14, padding: 24, backdropFilter: "blur(16px)",
                display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap",
                boxShadow: `0 0 24px ${riskColor}22`,
              }}>
                <ScoreGauge score={result.score} color={riskColor} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 3, marginBottom: 6, fontFamily: "monospace" }}>RISK ASSESSMENT</div>
                  <div style={{ fontSize: 36, fontWeight: 900, color: riskColor, letterSpacing: 2, lineHeight: 1, fontFamily: "monospace", filter: `drop-shadow(0 0 12px ${riskColor})` }}>
                    {result.verdict}
                  </div>
                  <div style={{ display: "inline-block", marginTop: 8, background: `${riskColor}22`, border: `1px solid ${riskColor}55`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: riskColor, letterSpacing: 2, fontFamily: "monospace" }}>
                    {result.label}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10, fontFamily: "monospace" }}>
                    Security Score: <span style={{ color: riskColor }}>{result.score}/100</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
                  <AuthBadge label="Mint Authority" value={result.mintAuth} />
                  <AuthBadge label="Freeze Authority" value={result.freezeAuth} />
                </div>
              </div>

              {/* Token Summary */}
              <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(103,232,249,0.1)", borderRadius: 14, padding: 20, backdropFilter: "blur(12px)" }}>
                <div style={{ fontSize: 11, color: "#67e8f9", letterSpacing: 3, marginBottom: 14, fontFamily: "monospace" }}>◈ TOKEN SUMMARY</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard label="PRICE" value={result.price} />
                  <StatCard label="MARKET CAP" value={result.mcap} />
                  <StatCard label="LIQUIDITY" value={result.liquidity} color={riskColor} />
                  <StatCard label="HOLDERS" value={result.holders} />
                </div>
              </div>

              {/* Reset */}
              <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
                style={{ background: "transparent", border: "1px solid rgba(103,232,249,0.2)", borderRadius: 8, padding: "10px", color: "rgba(103,232,249,0.6)", fontFamily: "monospace", fontSize: 12, cursor: "pointer", letterSpacing: 1 }}>
                ↺ NEW SCAN
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer */}
        <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.12)", letterSpacing: 2, fontFamily: "monospace", marginTop: 16 }}>
          CRYPTOCHECK AI • NEURAL ENGINE v4.2 • FOR EDUCATIONAL USE ONLY
        </div>
      </div>
    </main>
  );
}