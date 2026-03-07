"use client";
import { useState, useEffect, useRef } from "react";
const cyan = "#67e8f9";
const green = "#22c55e";
const red = "#ef4444";
const bg = "#050816";
const SCAN_LOGS = ["Initializing neural scan engine v4.2.1...","Resolving mint address on Solana mainnet...","Fetching on-chain metadata...","Checking token program ownership...","Analyzing liquidity pool depth...","Scanning holder distribution (top 100)...","Detecting freeze/mint authority flags...","Running rug-pull pattern recognition...","Cross-referencing blacklist databases...","Evaluating contract bytecode anomalies...","Computing risk entropy score...","Generating neural verdict..."];
const MOCK_RESULTS = {
  safe: { verdict: "SAFE", score: 91, color: green, label: "LOW RISK", price: "$0.0842", mcap: "$84.2M", liquidity: "$3.1M", holders: "12,440", mintAuth: "Revoked", freezeAuth: "Revoked" },
  warning: { verdict: "CAUTION", score: 54, color: "#f59e0b", label: "MEDIUM RISK", price: "$0.00031", mcap: "$310K", liquidity: "$42K", holders: "834", mintAuth: "Active", freezeAuth: "Revoked" },
  danger: { verdict: "DANGER", score: 12, color: red, label: "HIGH RISK", price: "$0.000002", mcap: "$2K", liquidity: "$800", holders: "67", mintAuth: "Active", freezeAuth: "Active" }
};
function pickResult(addr: string) {
  if (!addr) return MOCK_RESULTS.safe;
  const s = addr.toLowerCase();
  if (s.includes("rug") || s.includes("scam") || s.includes("fake")) return MOCK_RESULTS.danger;
  if (s.includes("warn") || s.includes("mid") || s.includes("sus")) return MOCK_RESULTS.warning;
  return MOCK_RESULTS.safe;
}
function GridBg() { return ( <div style={{ position: "fixed", inset: 0, zIndex: 0, backgroundImage: `linear-gradient(rgba(103,232,249,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.04) 1px, transparent 1px)`, backgroundSize: "40px 40px", animation: "gridMove 20s linear infinite", pointerEvents: "none" }} /> ); }
function Scanlines() { return ( <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)" }} /> ); }
function GaugeCircle({ score, color, scanning }: { score: number; color: string; scanning: boolean }) {
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    if (scanning) { setDisplayed(0); return; }
    let frame: number; let cur = 0;
    const step = () => { cur += 2; if (cur >= score) { setDisplayed(score); return; } setDisplayed(cur); frame = requestAnimationFrame(step); };
    frame = requestAnimationFrame(step); return () => cancelAnimationFrame(frame);
  }, [score, scanning]);
  const offset = circ - (displayed / 100) * circ;
  return (
    <div style={{ position: "relative", width: 128, height: 128 }}>
      <svg width="128" height="128" style={{ transform: "rotate(-90deg)" }}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="10" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="10" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.05s linear, stroke 0.5s", filter: `drop-shadow(0 0 8px ${color})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 28, fontWeight: 800, color, fontFamily: "monospace", lineHeight: 1 }}>{scanning ? "—" : displayed}</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>/ 100</span>
      </div>
    </div>
  );
}
function StatCard({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: "rgba(103,232,249,0.04)", border: "1px solid rgba(103,232,249,0.12)", borderRadius: 10, padding: "12px 16px", backdropFilter: "blur(8px)", flex: 1, minWidth: 90 }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: color || cyan, fontFamily: "monospace" }}>{value}</div>
    </div>
  );
}
function LogLine({ text }: { text: string }) { return ( <div style={{ fontFamily: "monospace", fontSize: 12, color: "rgba(103,232,249,0.85)", padding: "2px 0", display: "flex", alignItems: "center", gap: 8 }}> <span style={{ color: green, fontSize: 10 }}>▶</span> {text} </div> ); }
export default function CryptoCheckAI() {
  const [addr, setAddr] = useState("");
  const [phase, setPhase] = useState<"idle" | "scanning" | "result">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<typeof MOCK_RESULTS.safe | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, [logs]);
  const runScan = () => {
    if (!addr.trim()) return; setPhase("scanning"); setLogs([]); setResult(null);
    SCAN_LOGS.forEach((log, i) => { setTimeout(() => { setLogs(prev => [...prev, log]); }, i * 230); });
    setTimeout(() => { const res = pickResult(addr.trim()); setResult(res); setPhase("result"); }, SCAN_LOGS.length * 230 + 400);
  };
  return (
    <>
      <style>{` @keyframes gridMove { from { background-position: 0 0; } to { background-position: 40px 40px; } } @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } } @keyframes glowPulse { 0%,100% { box-shadow: 0 0 12px #67e8f9aa; } 50% { box-shadow: 0 0 28px #67e8f9ff; } } @keyframes fadeIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } } `}</style>
      <GridBg /><Scanlines />
      <div style={{ minHeight: "100vh", background: bg, color: "#fff", fontFamily: "monospace", position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", padding: "32px 16px 48px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: 6, color: cyan, marginBottom: 8, opacity: 0.7 }}>NEURAL SECURITY ENGINE v4.2</div>
          <h1 style={{ fontSize: "clamp(28px,5vw,44px)", fontWeight: 900, margin: 0, background: `linear-gradient(135deg, ${cyan}, #a78bfa)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", letterSpacing: 2 }}>CryptoCheck AI</h1>
        </div>
        <div style={{ width: "100%", maxWidth: 700, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ background: "rgba(103,232,249,0.04)", border: `1px solid rgba(103,232,249,0.2)`, borderRadius: 14, padding: 20, backdropFilter: "blur(16px)", animation: "glowPulse 3s ease-in-out infinite" }}>
            <div style={{ fontSize: 11, color: cyan, letterSpacing: 3, marginBottom: 12 }}>◈ NEURAL VERDICT TERMINAL</div>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={addr} onChange={e => setAddr(e.target.value)} onKeyDown={e => e.key === "Enter" && runScan()} placeholder="Enter Solana mint address..." style={{ flex: 1, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(103,232,249,0.2)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontFamily: "monospace", fontSize: 13, outline: "none" }} />
              <button onClick={runScan} disabled={phase === "scanning" || !addr.trim()} style={{ background: phase === "scanning" ? "rgba(103,232,249,0.1)" : `linear-gradient(135deg, ${cyan}, #06b6d4)`, border: "none", borderRadius: 8, padding: "10px 20px", color: phase === "scanning" ? cyan : "#050816", fontFamily: "monospace", fontSize: 13, fontWeight: 700, cursor: phase === "scanning" ? "not-allowed" : "pointer", letterSpacing: 1, animation: phase === "scanning" ? "pulse 1s infinite" : "none" }}> {phase === "scanning" ? "SCANNING..." : "⚡ ANALYZE"} </button>
            </div>
          </div>
          {(phase === "scanning" || phase === "result") && (
            <div style={{ background: "rgba(0,0,0,0.6)", border: "1px solid rgba(103,232,249,0.12)", borderRadius: 14, padding: 20, backdropFilter: "blur(12px)", animation: "fadeIn 0.4s ease" }}>
              <div ref={logRef} style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}> {logs.map((l, i) => <LogLine key={i} text={l} />)} </div>
            </div>
          )}
          {phase === "result" && result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeIn 0.5s ease" }}>
              <div style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${result.color}33`, borderRadius: 14, padding: 24, backdropFilter: "blur(16px)", display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
                <GaugeCircle score={result.score} color={result.color} scanning={false} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 36, fontWeight: 900, color: result.color, filter: `drop-shadow(0 0 12px ${result.color})` }}>{result.verdict}</div>
                  <div style={{ background: `${result.color}22`, border: `1px solid ${result.color}55`, borderRadius: 6, padding: "3px 10px", fontSize: 11, color: result.color, display: "inline-block" }}>{result.label}</div>
                </div>
              </div>
              <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(103,232,249,0.1)", borderRadius: 14, padding: 20, backdropFilter: "blur(12px)" }}>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <StatCard label="PRICE" value={result.price} />
                  <StatCard label="MARKET CAP" value={result.mcap} />
                  <StatCard label="LIQUIDITY" value={result.liquidity} color={result.score > 70 ? green : red} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
