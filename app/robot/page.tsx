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
    <div className="relative w-32 h-32 flex-shrink-0">
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
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono font-black text-3xl leading-none" style={{ color }}>{displayed}</span>
        <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>/100</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, color = "#67e8f9" }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 min-w-[90px] rounded-xl p-3 border"
      style={{ background: "rgba(103,232,249,0.04)", borderColor: "rgba(103,232,249,0.12)", backdropFilter: "blur(8px)" }}>
      <p className="font-mono text-[10px] tracking-widest mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</p>
      <p className="font-mono font-bold text-sm" style={{ color }}>{value}</p>
    </div>
  );
}

function AuthBadge({ label, value }: { label: string; value: string }) {
  const ok = value === "Revoked";
  return (
    <div className="rounded-lg px-3 py-2 border"
      style={{ background: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.08)" }}>
      <p className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>{label}</p>
      <p className="font-mono font-bold text-xs mt-1" style={{ color: ok ? "#22c55e" : "#ef4444" }}>
        {ok ? "✓ " : "✗ "}{value}
      </p>
    </div>
  );
}

function LogLine({ text }: { text: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 font-mono text-xs py-0.5"
      style={{ color: "rgba(103,232,249,0.85)" }}
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
    SCAN_LOGS.forEach((log, i) => {
      setTimeout(() => setLogs(prev => [...prev, log]), i * 230);
    });
    setTimeout(() => {
      setResult(pickResult(addr.trim()));
      setPhase("result");
    }, SCAN_LOGS.length * 230 + 400);
  };

  const reset = () => { setPhase("idle"); setAddr(""); setLogs([]); setResult(null); };
  const riskColor = result ? RISK_COLORS[result.risk] : "#67e8f9";

  return (
    <main className="relative min-h-screen flex flex-col items-center px-4 py-10"
      style={{ background: "#050816", color: "#fff" }}>
      <GridBackground />
      <div className="relative z-10 w-full max-w-2xl flex flex-col gap-5">

        <div className="text-center mb-4">
          <p className="font-mono text-[11px] tracking-[6px] mb-2" style={{ color: "rgba(103,232,249,0.6)" }}>
            NEURAL SECURITY ENGINE v4.2
          </p>
          <h1 className="font-mono font-black text-4xl md:text-5xl tracking-widest"
            style={{ background: "linear-gradient(135deg,#67e8f9,#a78bfa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            CryptoCheck AI
          </h1>
          <p className="font-mono text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
            Solana Token Risk Intelligence Platform
          </p>
        </div>

        <div className="rounded-2xl p-5 border glow-pulse"
          style={{ background: "rgba(103,232,249,0.04)", borderColor: "rgba(103,232,249,0.2)", backdropFilter: "blur(16px)" }}>
          <p className="font-mono text-[11px] tracking-[3px] mb-3" style={{ color: "#67e8f9" }}>◈ NEURAL VERDICT TERMINAL</p>
          <div className="flex gap-3">
            <input
              value={addr}
              onChange={e => setAddr(e.target.value)}
              onKeyDown={e => e.key === "Enter" && runScan()}
              placeholder="Enter Solana mint address..."
              className="flex-1 rounded-lg px-4 py-2.5 font-mono text-sm border text-white"
              style={{ background: "rgba(0,0,0,0.5)", borderColor: "rgba(103,232,249,0.2)" }}
            />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={runScan}
              disabled={phase === "scanning" || !addr.trim()}
              className="px-5 py-2.5 rounded-lg font-mono font-bold text-sm tracking-wider whitespace-nowrap"
              style={{
                background: phase === "scanning" ? "rgba(103,232,249,0.1)" : "linear-gradient(135deg,#67e8f9,#06b6d4)",
                color: phase === "scanning" ? "#67e8f9" : "#050816",
                cursor: phase === "scanning" ? "not-allowed" : "pointer",
              }}
            >
              {phase === "scanning" ? "SCANNING..." : "⚡ ANALYZE"}
            </motion.button>
          </div>
          <p className="font-mono text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.2)" }}>
            TIP: type "rug" → Danger · "warn" → Caution · anything else → Safe
          </p>
        </div>

        <AnimatePresence>
          {(phase === "scanning" || phase === "result") && (
            <motion.div key="feed"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="rounded-2xl p-5 border"
              style={{ background: "rgba(0,0,0,0.6)", borderColor: "rgba(103,232,249,0.12)", backdropFilter: "blur(12px)" }}>
              <p className="font-mono text-[11px] tracking-[3px] mb-3" style={{ color: "#67e8f9" }}>◈ ANALYSIS FEED</p>
              <div ref={logRef} className="max-h-44 overflow-y-auto flex flex-col gap-0.5 pr-1">
                {logs.map((l, i) => <LogLine key={i} text={l} />)}
                {phase === "scanning" && (
                  <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.7 }}
                    className="font-mono text-xs mt-1" style={{ color: "#67e8f9" }}>▌</motion.span>
                )}
                {phase === "result" && (
                  <p className="font-mono text-xs mt-1" style={{ color: "#22c55e" }}>✓ Scan complete.</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {phase === "result" && result && (
            <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col gap-4">
              <div className="rounded-2xl p-6 border flex flex-wrap items-center gap-6"
                style={{ background: "rgba(0,0,0,0.55)", borderColor: `${riskColor}44`, backdropFilter: "blur(16px)", boxShadow: `0 0 24px ${riskColor}22` }}>
                <ScoreGauge score={result.score} color={riskColor} />
                <div className="flex-1 min-w-[150px]">
                  <p className="font-mono text-[10px] tracking-[3px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>RISK ASSESSMENT</p>
                  <p className="font-mono font-black text-4xl tracking-widest leading-none"
                    style={{ color: riskColor, filter: `drop-shadow(0 0 10px ${riskColor})` }}>
                    {result.verdict}
                  </p>
                  <span className="inline-block mt-2 px-3 py-0.5 rounded font-mono text-[11px] tracking-widest border"
                    style={{ color: riskColor, borderColor: `${riskColor}55`, background: `${riskColor}18` }}>
                    {result.label}
                  </span>
                  <p className="font-mono text-xs mt-2" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Security Score: <span style={{ color: riskColor }}>{result.score}/100</span>
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-w-[130px]">
                  <AuthBadge label="Mint Authority" value={result.mintAuth} />
                  <AuthBadge label="Freeze Authority" value={result.freezeAuth} />
                </div>
              </div>

              <div className="rounded-2xl p-5 border"
                style={{ background: "rgba(0,0,0,0.4)", borderColor: "rgba(103,232,249,0.1)", backdropFilter: "blur(12px)" }}>
                <p className="font-mono text-[11px] tracking-[3px] mb-3" style={{ color: "#67e8f9" }}>◈ TOKEN SUMMARY</p>
                <div className="flex gap-3 flex-wrap">
                  <StatCard label="PRICE" value={result.price} />
                  <StatCard label="MARKET CAP" value={result.mcap} />
                  <StatCard label="LIQUIDITY" value={result.liquidity} color={riskColor} />
                  <StatCard label="HOLDERS" value={result.holders} />
                </div>
              </div>

              <motion.button whileTap={{ scale: 0.97 }} onClick={reset}
                className="w-full py-2.5 rounded-xl font-mono text-xs tracking-widest border"
                style={{ borderColor: "rgba(103,232,249,0.2)", color: "rgba(103,232,249,0.5)", background: "transparent", cursor: "pointer" }}>
                ↺ NEW SCAN
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="text-center font-mono text-[10px] tracking-widest mt-4" style={{ color: "rgba(255,255,255,0.12)" }}>
          CRYPTOCHECK AI • NEURAL ENGINE v4.2 • FOR EDUCATIONAL USE ONLY
        </p>
      </div>
    </main>
  );
}
