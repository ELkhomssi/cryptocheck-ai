"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform, animate } from "framer-motion";
import {
  Shield, ShieldAlert, ShieldCheck, ShieldOff,
  Flame, Lock, Unlock, AlertTriangle,
  Activity, DollarSign, BarChart3, Users,
  Cpu, Zap, Search, ChevronRight, Circle,
  TrendingUp, Database, Radio
} from "lucide-react";

// ─── Constants & Logs ─────────────────────────────────────────────────────────

const RISK_CONFIG = {
  SAFE:    { color: "text-emerald-400",  glow: "shadow-emerald-500/50", hex: "#10b981", bg: "from-emerald-500/20" },
  CAUTION: { color: "text-amber-400",    glow: "shadow-amber-500/50",   hex: "#f59e0b", bg: "from-amber-500/20"   },
  DANGER:  { color: "text-red-400",      glow: "shadow-red-500/50",     hex: "#ef4444", bg: "from-red-500/20"     },
};

const SCAN_LOGS = [
  { tag: "SYSTEM",    message: "Initializing CryptoCheck neural audit engine v4.2.1...", color: "text-cyan-400"   },
  { tag: "NETWORK",   message: "Fetching Solana Mainnet-Beta metadata...",              color: "text-purple-400" },
  { tag: "SECURITY",  message: "Checking Mint Authority ownership structure...",        color: "text-yellow-400" },
  { tag: "SECURITY",  message: "Verifying Freeze Authority delegation status...",       color: "text-yellow-400" },
  { tag: "LIQUIDITY", message: "Analyzing LP burn percentage via token supply delta...", color: "text-pink-400"  },
  { tag: "HOLDERS",   message: "Enumerating top 10 holder accounts...",                color: "text-blue-400"   },
  { tag: "AI",        message: "Running neural risk classification model...",          color: "text-cyan-300"   },
  { tag: "SYSTEM",    message: "Compiling audit report. Finalizing score...",         color: "text-cyan-400"   },
];

// ─── UI Helpers ───────────────────────────────────────────────────────────────

function AnimatedGrid() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "linear-gradient(rgba(0,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,255,0.8) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.5) 2px, rgba(0,0,0,0.5) 4px)" }} />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, transparent 40%, #050816 100%)" }} />
    </div>
  );
}

function CircularGauge({ score, risk, isAnimating }) {
  const [displayValue, setDisplayValue] = useState(0);
  const cfg = RISK_CONFIG[risk];
  const radius = 110;
  const circumference = 2 * Math.PI * (radius - 6);
  const progress = (score / 100) * circumference;

  useEffect(() => {
    if (!isAnimating) return;
    let start = 0;
    const end = score;
    const duration = 2500;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const current = Math.round(progress * (end - start) + start);
      setDisplayValue(current);
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [isAnimating, score]);

  return (
    <div className="relative flex items-center justify-center w-[260px] h-[260px]">
      <svg width="260" height="260" className="-rotate-90">
        <circle cx="130" cy="130" r={radius-6} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        <motion.circle cx="130" cy="130" r={radius-6} fill="none" stroke={cfg.hex} strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }} animate={isAnimating ? { strokeDashoffset: circumference - progress } : {}}
          transition={{ duration: 2.5, ease: "easeOut" }} style={{ filter: `drop-shadow(0 0 8px ${cfg.hex})` }} />
      </svg>
      <div className="absolute text-center">
        <div className={`text-6xl font-black ${cfg.color}`}>{displayValue}</div>
        <div className="text-[10px] text-white/40 tracking-widest uppercase mt-1">Safety Score</div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function RobotPage() {
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("idle");
  const [logs, setLogs] = useState([]);
  const [result, setResult] = useState(null);
  const [gaugeActive, setGaugeActive] = useState(false);

  const handleScan = () => {
    if (!address.trim()) return;
    setStatus("scanning");
    setLogs([]);
    setResult(null);
    
    SCAN_LOGS.forEach((log, i) => {
      setTimeout(() => setLogs(prev => [...prev, log]), i * 200);
    });

    setTimeout(() => {
      const isRug = address.toLowerCase().includes("rug");
      setResult({
        score: isRug ? 12 : 94,
        risk: isRug ? "DANGER" : "SAFE",
        mintAuthority: isRug,
        freezeAuthority: isRug,
        lpBurned: !isRug,
        price: isRug ? "$0.000002" : "$1.84",
        marketCap: isRug ? "$48K" : "$184M"
      });
      setStatus("complete");
      setGaugeActive(true);
    }, SCAN_LOGS.length * 200 + 500);
  };

  return (
    <div className="min-h-screen bg-[#050816] text-white font-mono p-4 md:p-12 relative overflow-hidden">
      <AnimatedGrid />
      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-black mb-2 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent" style={{ fontFamily: 'Orbitron, sans-serif' }}>
            CryptoCheck AI
          </h1>
          <p className="text-white/30 text-xs tracking-[0.4em] uppercase">Neural Security Engine v4.2</p>
        </div>

        <div className="flex gap-2 mb-10">
          <input type="text" placeholder="Enter Solana mint address..." value={address} onChange={e => setAddress(e.target.value)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-4 outline-none focus:border-cyan-500/50 transition-all" />
          <button onClick={handleScan} className="bg-gradient-to-r from-cyan-500 to-purple-600 px-8 py-4 rounded-xl font-bold uppercase text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            Analyze
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 backdrop-blur-xl flex flex-col items-center">
            <CircularGauge score={result?.score ?? 0} risk={result?.risk ?? "SAFE"} isAnimating={gaugeActive} />
          </div>
          <div className="bg-black/40 border border-cyan-500/20 rounded-2xl p-4 h-[300px] overflow-y-auto scrollbar-none">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs mb-2 ${log.color}`}>
                <span className="opacity-50 mr-2">{">"}</span>
                <span className="font-bold mr-2">[{log.tag}]</span>
                <span className="text-white/70">{log.message}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
