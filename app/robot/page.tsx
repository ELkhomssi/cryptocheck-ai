"use client";

import { useState, useEffect, useRef } from "react";

const cyan = "#67e8f9";
const green = "#22c55e";
const red = "#ef4444";
const bg = "#050816";

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

const MOCK_RESULTS = {
  safe: {
    verdict: "SAFE",
    score: 91,
    color: green,
    label: "LOW RISK",
    price: "$0.0842",
    mcap: "$84.2M",
    liquidity: "$3.1M",
    holders: "12,440",
    mintAuth: "Revoked",
    freezeAuth: "Revoked",
  },
  warning: {
    verdict: "CAUTION",
    score: 54,
    color: "#f59e0b",
    label: "MEDIUM RISK",
    price: "$0.00031",
    mcap: "$310K",
    liquidity: "$42K",
    holders: "834",
    mintAuth: "Active",
    freezeAuth: "Revoked",
  },
  danger: {
    verdict: "DANGER",
    score: 12,
    color: red,
    label: "HIGH RISK",
    price: "$0.000002",
    mcap: "$2K",
    liquidity: "$800",
    holders: "67",
    mintAuth: "Active",
    freezeAuth: "Active",
  },
};

function pickResult(addr: string) {
  if (!addr) return MOCK_RESULTS.safe;
  const s = addr.toLowerCase();
  if (s.includes("rug") || s.includes("scam") || s.includes("fake")) return MOCK_RESULTS.danger;
  if (s.includes("warn") || s.includes("mid") || s.includes("sus")) return MOCK_RESULTS.warning;
  return MOCK_RESULTS.safe;
}

function GridBg() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 0,
      backgroundImage: `linear-gradient(rgba(103,232,249,0.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(103,232,249,0.04) 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
      animation: "gridMove 20s linear infinite",
      pointerEvents: "none",
    }} />
  );
}

function Scanlines() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none",
      background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
    }} />
  );
}

function GaugeCircle({ score, color, scanning }: { score: number; color: string; scanning: boolean }) {
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    if (scanning) { setDisplayed(0); return; }
    let frame: number;
    let cur = 0;
    const step = () => {
      cur += 2;
      if (cur >= score) { setDisplayed(score); return; }
      setDisplayed(cur);
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [score, scanning]);

  const offset = circ - (displayed / 100) * circ;

  return (
    <div style={{ position: "relative", width: 128, height: 128 }}>
      <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.05s linear, stroke 0.5s", filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1 }}>
          {scanning ? "—" : displayed}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>/ 100</span>
      </div>
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{
      background: "rgba(103,232,249,0.04)",
      border: "1px solid rgba(103,232,249,0.12)",
      borderRadius: 10,
      padding: "12px 16px",
      backdropFilter: "blur(8px)",
      flex: 1,
      minWidth: 90,
    }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || cyan, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}

function LogLine({ text }: { text: string }) {
  return (
    <div style={{
      fontFamily: "monospace", fontSize: 12,
      color: "rgba(103,232,249,0.85)",
      padding: "2px 0",
      display: "flex", alignItems: "center", gap: 8,
    }}>
      <span style={{ color: green, fontSize: 10 }}>▶</span>
      {text}
    </div>
  );
}

export default function CryptoCheckAI() {
  const [addr, setAddr] = useState("");
  const [phase, setPhase] = useState<"idle" | "scanning" | "result">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<typeof MOCK_RESULTS.safe | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const runScan = () => {
    if (!addr.trim()) return;
    setPhase("scanning");
    setLogs([]);
    setResult(null);

    SCAN_LOGS.forEach((log, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, log]);
      }, i * 230);
    });

    setTimeout(() => {
      const res = pickResult(addr.trim());
      setResult(res);
      setPhase("result");
    }, SCAN_LOGS.length * 230 + 400);
  };

  return (
    <>
      <style>{`
        @keyframes gridMove { from { background-position: 0 0; } to { background-position: 40px 40px; } }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes glowPulse { 0%,100% { box-shadow: 0 0 12px #67e8f9aa; } 50% { box-shadow: 0 0 28px #67e8f9ff; } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(103,232,249,0.3); border-radius: 4px; }
      `}</style>
      <GridBg />
      <Scanlines />

      <div style={{
        minHeight: "100vh", background: bg, color: "#fff",
        fontFamily: "monospace", position: "relative", zIndex: 2,
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: "32px 16px 48px",
      }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: cyan, marginBottom: 8, opacity: 0.7 }}>
            NEURAL SECURITY ENGINE v4.2
          </div>
          <h1 style={{
            fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, margin: 0,
            background: `linear-gradient(135deg, ${cyan}, #a78bfa)`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: 2,
          }}>
            CryptoCheck AI
          </h1>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>
            Solana Token Risk Intelligence Platform
          </div>
        </div>

        <div style={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Search Bar */}
          <div style={{
            background: "rgba(103,232,249,0.04)",
            border: `1px solid rgba(103,232,249,0.2)`,
            borderRadius: 14, padding: 20,
            backdropFilter: "blur(16px)",
            animation: "glowPulse 3s ease-in-out infinite",
          }}>
            <div style={{ fontSize: 11, color: cyan, letterSpacing: 3, marginBottom: 12 }}>
              ◈ NEURAL VERDICT TERMINAL
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                value={addr}
                onChange={e => setAddr(e.target.value)}
                onKeyDown={e => e.key === "Enter" && runScan()}
                placeholder="Enter Solana mint address..."
                style={{
                  flex: 1, background: "rgba(0,0,0,0.5)",
                  border: "1px solid rgba(103,232,249,0.2)",
                  borderRadius: 8, padding: "10px 14px",
                  color: "#fff", fontFamily: "monospace", fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                onClick={runScan}
                disabled={phase === "scanning" || !addr.trim()}
                style={{
                  background: phase === "scanning"
                    ? "rgba(103,232,249,0.1)"
                    : `linear-gradient(135deg, ${cyan}, #06b6d4)`,
                  border: "none", borderRadius: 8,
                  padding: "10px 20px",
                  color: phase === "scanning" ? cyan : "#050816",
                  fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                  cursor: phase === "scanning" ? "not-allowed" : "pointer",
                  letterSpacing: 1, transition: "all 0.3s",
                  animation: phase === "scanning" ? "pulse 1s infinite" : "none",
                  whiteSpace: "nowrap",
                }}
              >
                {phase === "scanning" ? "SCANNING..." : "⚡ ANALYZE"}
              </button>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginTop: 8 }}>
              TIP: try typing "rug", "warn", or any address to simulate different risk levels
            </div>
          </div>

          {/* Analysis Feed */}
          {(phase === "scanning" || phase === "result") && (
            <div style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(103,232,249,0.12)",
              borderRadius: 14, padding: 20,
              backdropFilter: "blur(12px)",
              animation: "fadeIn 0.4s ease",
            }}>
              <div style={{ fontSize: 11, color: cyan, letterSpacing: 3, marginBottom: 12 }}>
                ◈ ANALYSIS FEED
              </div>
              <div ref={logRef} style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
                {logs.map((l, i) => <LogLine key={i} text={l} />)}
                {phase === "scanning" && (
                  <div style={{ color: cyan, fontFamily: "monospace", fontSize: 12, animation: "pulse 0.8s infinite", marginTop: 4 }}>▌</div>
                )}
                {phase === "result" && (
                  <div style={{ color: green, fontFamily: "monospace", fontSize: 12, marginTop: 4 }}>✓ Scan complete.</div>
                )}
              </div>
            </div>
          )}

          {/* Result Panel */}
          {phase === "result" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.5s ease" }}>

              {/* Verdict + Gauge */}
              <div style={{
                background: "rgba(0,0,0,0.5)",
                border: `1px solid ${result.color}33`,
                borderRadius: 14, padding: 24,
                backdropFilter: "blur(16px)",
                display: "flex", alignItems: "center", gap: 24,
                flexWrap: "wrap",
              }}>
                <GaugeCircle score={result.score} color={result.color} scanning={false} />
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", letterSpacing: 3, marginBottom: 6 }}>RISK ASSESSMENT</div>
                  <div style={{
                    fontSize: 36, fontWeight: 900, color: result.color,
                    letterSpacing: 2, lineHeight: 1,
                    filter: `drop-shadow(0 0 12px ${result.color})`,
                  }}>
                    {result.verdict}
                  </div>
                  <div style={{
                    display: "inline-block", marginTop: 8,
                    background: `${result.color}22`,
                    border: `1px solid ${result.color}55`,
                    borderRadius: 6, padding: "3px 10px",
                    fontSize: 11, color: result.color, letterSpacing: 2,
                  }}>
                    {result.label}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                    Security Score: <span style={{ color: result.color }}>{result.score}/100</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 130 }}>
                  {[
                    { label: "Mint Authority", val: result.mintAuth },
                    { label: "Freeze Authority", val: result.freezeAuth },
                  ].map(f => (
                    <div key={f.label} style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      borderRadius: 8, padding: "8px 12px",
                    }}>
                      <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 1 }}>{f.label}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, color: f.val === "Revoked" ? green : red }}>
                        {f.val === "Revoked" ? "✓ " : "✗ "}{f.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Token Summary */}
              <div style={{
                background: "rgba(0,0,0,0.4)",
                border: "1px solid rgba(103,232,249,0.1)",
                borderRadius: 14, padding: 20,
                backdropFilter: "blur(12px)",
              }}>
                <div style={{ fontSize: 11, color: cyan, letterSpacing: 3, marginBottom: 14 }}>◈ TOKEN SUMMARY</div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard label="PRICE" value={result.price} />
                  <StatCard label="MARKET CAP" value={result.mcap} />
                  <StatCard label="LIQUIDITY" value={result.liquidity} color={result.score > 70 ? green : result.score > 40 ? "#f59e0b" : red} />
                  <StatCard label="HOLDERS" value={result.holders} />
                </div>
              </div>

              {/* Reset */}
              <button
                onClick={() => { setPhase("idle"); setAddr(""); setLogs([]); setResult(null); }}
                style={{
                  background: "transparent",
                  border: "1px solid rgba(103,232,249,0.2)",
                  borderRadius: 8, padding: "10px",
                  color: "rgba(103,232,249,0.6)",
                  fontFamily: "monospace", fontSize: 12, cursor: "pointer",
                  transition: "all 0.2s", letterSpacing: 1,
                }}
              >
                ↺ NEW SCAN
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 40, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 2, textAlign: "center" }}>
          CRYPTOCHECK AI • NEURAL ENGINE v4.2 • FOR EDUCATIONAL USE ONLY
        </div>
      </div>
    </>
  );
}
