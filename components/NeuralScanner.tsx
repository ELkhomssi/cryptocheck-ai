"use client";

/**
 * CryptoCheck AI — components/NeuralScanner.tsx
 * Carbon & Cyber-Gold Stealth Terminal with typewriter analysis output.
 * Framer Motion for liquid state transitions.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { EngineResult } from "@/lib/engine";

// ─── Types ──────────────────────────────────────────────────────────────────

type ScanState = "idle" | "scanning" | "complete" | "error";

// ─── Sub: Score Arc ──────────────────────────────────────────────────────────

function ScoreArc({ score, level }: { score: number; level: string }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const dash = (score / 100) * circ;

  const palette: Record<string, { stroke: string; glow: string; text: string }> = {
    SAFE:     { stroke: "#00ff88", glow: "#00ff8840", text: "#00ff88" },
    LOW:      { stroke: "#b4ff44", glow: "#b4ff4430", text: "#b4ff44" },
    MEDIUM:   { stroke: "#00d4ff", glow: "#00d4ff40", text: "#00d4ff" },
    HIGH:     { stroke: "#ff6b35", glow: "#ff6b3540", text: "#ff6b35" },
    CRITICAL: { stroke: "#ff2244", glow: "#ff224450", text: "#ff2244" },
  };
  const col = palette[level] ?? palette.MEDIUM;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 136, height: 136 }}>
      <svg width="136" height="136" style={{ transform: "rotate(-90deg)" }}>
        {/* Track */}
        <circle cx="68" cy="68" r={radius} fill="none"
          stroke="rgba(255,255,255,0.04)" strokeWidth="6" />
        {/* Glow layer */}
        <circle cx="68" cy="68" r={radius} fill="none"
          stroke={col.stroke} strokeWidth="10" strokeOpacity="0.12"
          strokeDasharray={circ} strokeDashoffset={circ - dash} strokeLinecap="round" />
        {/* Main arc */}
        <circle cx="68" cy="68" r={radius} fill="none"
          stroke={col.stroke} strokeWidth="3" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ - dash}
          style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1), stroke 0.4s" }}
          filter={`drop-shadow(0 0 6px ${col.stroke})`} />
      </svg>
      <div className="absolute flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold leading-none"
          style={{ color: col.text, textShadow: `0 0 20px ${col.text}60` }}>
          {score}
        </span>
        <span className="text-[9px] tracking-[0.2em] uppercase mt-1"
          style={{ color: col.text + "80" }}>
          safety
        </span>
      </div>
    </div>
  );
}

// ─── Sub: Category Bars ──────────────────────────────────────────────────────

function CategoryBar({ label, score, delay }: { label: string; score: number; delay: number }) {
  const col = score >= 75 ? "#00ff88" : score >= 50 ? "#00d4ff" : "#ff2244";
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="flex items-center gap-3"
    >
      <span className="text-[10px] font-mono w-32 flex-shrink-0"
        style={{ color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
        {label.toUpperCase()}
      </span>
      <div className="flex-1 h-[1px] relative" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div
          className="absolute top-0 left-0 h-full"
          style={{ background: col, boxShadow: `0 0 8px ${col}60` }}
          initial={{ width: "0%" }}
          animate={{ width: `${score}%` }}
          transition={{ delay: delay + 0.1, duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
      <span className="text-[10px] font-mono w-8 text-right flex-shrink-0"
        style={{ color: col }}>
        {score}
      </span>
    </motion.div>
  );
}

// ─── Sub: Flag Item ──────────────────────────────────────────────────────────

const FLAG_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  CRITICAL: { bg: "rgba(255,34,68,0.08)", text: "#ff2244", border: "rgba(255,34,68,0.2)" },
  HIGH:     { bg: "rgba(255,107,53,0.08)", text: "#ff6b35", border: "rgba(255,107,53,0.2)" },
  MEDIUM:   { bg: "rgba(255,179,0,0.08)", text: "#00d4ff", border: "rgba(255,179,0,0.2)" },
  LOW:      { bg: "rgba(180,255,68,0.08)", text: "#b4ff44", border: "rgba(180,255,68,0.2)" },
  SAFE:     { bg: "rgba(0,255,136,0.08)", text: "#00ff88", border: "rgba(0,255,136,0.2)" },
};

function FlagChip({ flag, idx }: { flag: any; idx: number }) {
  const [open, setOpen] = useState(false);
  const s = FLAG_STYLES[flag.level] ?? FLAG_STYLES.MEDIUM;

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05, duration: 0.25 }}
      onClick={() => setOpen(!open)}
      className="cursor-pointer rounded-sm border px-3 py-2 text-[11px] font-mono transition-all duration-200"
      style={{ background: s.bg, borderColor: s.border, color: s.text }}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <span className="opacity-60 text-[9px] tracking-widest">[{flag.level}]</span>
          <span>{flag.title}</span>
          {flag.evidence && (
            <span className="opacity-40 text-[10px]">:: {flag.evidence}</span>
          )}
        </span>
        <span className="opacity-30 text-xs">{open ? "▲" : "▼"}</span>
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <p className="mt-2 pt-2 border-t text-[10px] leading-relaxed opacity-70"
              style={{ borderColor: s.border + "40" }}>
              {flag.detail}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Sub: Typewriter Terminal ─────────────────────────────────────────────────

function TypewriterTerminal({ lines, accent }: { lines: string[]; accent: string }) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDisplayed([]);
    setCurrentLine(0);
    setCurrentChar(0);
    setDone(false);
  }, [lines]);

  useEffect(() => {
    if (currentLine >= lines.length) { setDone(true); return; }
    const line = lines[currentLine];

    if (currentChar >= line.length) {
      const t = setTimeout(() => {
        setDisplayed(prev => [...prev, line]);
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, 12);
      return () => clearTimeout(t);
    }

    const speed = line.startsWith(">") ? 18 : line.trim() === "" ? 1 : 8;
    const t = setTimeout(() => setCurrentChar(c => c + 1), speed);
    return () => clearTimeout(t);
  }, [currentLine, currentChar, lines]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [displayed, currentChar]);

  const isImportantLine = (l: string) =>
    l.startsWith(">") || l.includes("VERDICT") || l.includes("SCORE");

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto p-4 font-mono text-[11px] leading-relaxed"
      style={{ scrollbarWidth: "thin", scrollbarColor: `${accent}20 transparent` }}>
      {displayed.map((line, i) => (
        <div key={i}
          className="whitespace-pre"
          style={{
            color: line.includes("CRITICAL") ? "#ff2244"
              : line.includes("⚠") ? "#00d4ff"
              : line.includes("✓") ? "#00ff88"
              : line.includes("VERDICT") || line.includes("SCORE") ? accent
              : isImportantLine(line) ? "rgba(255,255,255,0.7)"
              : "rgba(255,255,255,0.35)",
          }}>
          {line || " "}
        </div>
      ))}
      {/* Currently typing line */}
      {currentLine < lines.length && (
        <div className="whitespace-pre flex items-center"
          style={{ color: "rgba(255,255,255,0.6)" }}>
          {lines[currentLine].slice(0, currentChar)}
          <motion.span
            animate={{ opacity: [1, 0] }}
            transition={{ repeat: Infinity, duration: 0.5 }}
            style={{ color: accent }}
          >▋</motion.span>
        </div>
      )}
      {done && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-2 flex items-center gap-2"
          style={{ color: accent }}>
          <motion.span animate={{ opacity: [1, 0] }} transition={{ repeat: Infinity, duration: 0.8 }}>▋</motion.span>
          <span className="text-[10px] tracking-widest">AWAITING INPUT_</span>
        </motion.div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface NeuralScannerProps {
  accent?: string;
  onResult?: (result: EngineResult) => void;
  initialMint?: string;
}

export function NeuralScanner({
  accent = "#00ff88",
  onResult,
  initialMint = "",
}: NeuralScannerProps) {
  const [mint, setMint] = useState(initialMint);
  const [state, setState] = useState<ScanState>("idle");
  const [result, setResult] = useState<EngineResult | null>(null);
  const [error, setError] = useState("");
  const [view, setView] = useState<"terminal" | "visual">("terminal");

  const scan = useCallback(async (address?: string) => {
    const target = (address ?? mint).trim();
    if (!target || state === "scanning") return;

    setState("scanning");
    setResult(null);
    setError("");

    try {
      const res = await fetch(`/api/analyze?mint=${encodeURIComponent(target)}`);
      const json = await res.json();
      if (json.success) {
        setResult(json.result);
        setState("complete");
        onResult?.(json.result);
      } else {
        setError(json.error?.message ?? "Analysis failed");
        setState("error");
      }
    } catch {
      setError("Network failure. Check your connection.");
      setState("error");
    }
  }, [mint, state, onResult]);

  useEffect(() => {
    if (initialMint) scan(initialMint);
  }, [initialMint]);

  const levelColor: Record<string, string> = {
    SAFE: "#00ff88", LOW: "#b4ff44", MEDIUM: "#00d4ff",
    HIGH: "#ff6b35", CRITICAL: "#ff2244",
  };
  const resultColor = result ? (levelColor[result.level] ?? accent) : accent;

  return (
    <div className="flex flex-col h-full"
      style={{
        background: "rgba(8,8,8,0.95)",
        border: `0.5px solid ${accent}25`,
        borderRadius: 2,
      }}>

      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `0.5px solid rgba(255,255,255,0.06)` }}>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {["#ff2244", "#00d4ff", "#00ff88"].map((c, i) => (
              <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: c + "60", border: `0.5px solid ${c}40` }} />
            ))}
          </div>
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(255,255,255,0.3)" }}>
            NEURAL VERDICT TERMINAL
          </span>
        </div>
        {state === "complete" && (
          <div className="flex gap-1">
            {(["terminal", "visual"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className="px-2 py-1 text-[9px] font-mono tracking-widest uppercase transition-all"
                style={{
                  color: view === v ? accent : "rgba(255,255,255,0.25)",
                  borderBottom: view === v ? `1px solid ${accent}` : "1px solid transparent",
                }}>
                {v}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 flex-shrink-0"
        style={{ borderBottom: `0.5px solid rgba(255,255,255,0.04)` }}>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]" style={{ color: accent }}>$</span>
          <input
            value={mint}
            onChange={e => setMint(e.target.value)}
            onKeyDown={e => e.key === "Enter" && scan()}
            placeholder="analyze --mint <SOLANA_ADDRESS>"
            className="flex-1 bg-transparent font-mono text-[12px] outline-none placeholder:opacity-20"
            style={{ color: "rgba(255,255,255,0.85)", caretColor: accent }}
            spellCheck={false}
            autoComplete="off"
          />
          <motion.button
            onClick={() => scan()}
            disabled={state === "scanning" || !mint.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-1.5 font-mono text-[10px] tracking-[0.15em] uppercase disabled:opacity-30 transition-all"
            style={{
              border: `0.5px solid ${accent}50`,
              color: accent,
              background: `${accent}10`,
              borderRadius: 1,
            }}>
            {state === "scanning" ? (
              <span className="flex items-center gap-2">
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  className="inline-block w-3 h-3 border rounded-full"
                  style={{ borderColor: accent, borderTopColor: "transparent" }}
                />
                SCANNING
              </span>
            ) : "EXECUTE"}
          </motion.button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* IDLE */}
          {state === "idle" && (
            <motion.div key="idle"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="font-mono text-[10px] leading-relaxed text-center"
                style={{ color: "rgba(255,255,255,0.15)" }}>
                <div className="mb-4" style={{ color: accent + "60", fontSize: 28 }}>⬡</div>
                <div className="tracking-[0.2em] mb-2">NEURAL SCANNER READY</div>
                <div className="opacity-60">ENTER MINT ADDRESS TO INITIALIZE ANALYSIS</div>
                <div className="mt-4 opacity-40">
                  {["> AUTHORITY CHECK", "> DISTRIBUTION ANALYSIS", "> LIQUIDITY DEPTH SCAN", "> PATTERN RECOGNITION"].map((l, i) => (
                    <motion.div key={l}
                      initial={{ opacity: 0 }} animate={{ opacity: 0.5 }}
                      transition={{ delay: i * 0.3 + 0.5 }}
                      className="text-left">{l}</motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* SCANNING */}
          {state === "scanning" && (
            <motion.div key="scanning"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-6 p-8">
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                  className="w-16 h-16 rounded-full"
                  style={{ border: `0.5px solid ${accent}20`, borderTopColor: accent }}
                />
                <motion.div
                  animate={{ rotate: -360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                  className="absolute inset-2 rounded-full"
                  style={{ border: `0.5px solid ${accent}10`, borderRightColor: accent + "80" }}
                />
              </div>
              <div className="text-center">
                <div className="font-mono text-[11px] tracking-[0.2em]" style={{ color: accent }}>
                  SCANNING CHAIN
                </div>
                <motion.div
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="font-mono text-[10px] mt-2"
                  style={{ color: "rgba(255,255,255,0.3)" }}>
                  FETCHING ON-CHAIN DATA...
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* ERROR */}
          {state === "error" && (
            <motion.div key="error"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center gap-4 p-8">
              <div className="font-mono text-[10px] text-center space-y-2">
                <div style={{ color: "#ff2244", fontSize: 20 }}>✕</div>
                <div style={{ color: "#ff2244" }} className="tracking-widest">ANALYSIS FAILED</div>
                <div style={{ color: "rgba(255,255,255,0.25)" }}>{error}</div>
                <button onClick={() => scan()}
                  className="mt-4 px-4 py-2 font-mono text-[10px] tracking-widest uppercase"
                  style={{ border: "0.5px solid rgba(255,34,68,0.3)", color: "#ff2244", background: "rgba(255,34,68,0.06)" }}>
                  RETRY
                </button>
              </div>
            </motion.div>
          )}

          {/* COMPLETE — Terminal View */}
          {state === "complete" && result && view === "terminal" && (
            <motion.div key="terminal"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full">
              <TypewriterTerminal lines={result.narrativeLines} accent={resultColor} />
            </motion.div>
          )}

          {/* COMPLETE — Visual View */}
          {state === "complete" && result && view === "visual" && (
            <motion.div key="visual"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full overflow-y-auto p-4 space-y-5">

              {/* Score + token */}
              <div className="flex items-center gap-4">
                <ScoreArc score={result.score} level={result.level} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-base font-bold" style={{ color: "rgba(255,255,255,0.9)" }}>
                      {result.token.name}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-sm"
                      style={{ background: resultColor + "15", color: resultColor, border: `0.5px solid ${resultColor}30` }}>
                      {result.token.symbol}
                    </span>
                  </div>
                  <div className="font-mono text-sm mt-1 font-bold" style={{ color: resultColor }}>
                    {result.verdict}
                  </div>
                  <div className="flex gap-3 mt-2 text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
                    <span>💧 ${result.token.liquidityUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                    <span>⚡ {result.token.fetchMs}ms</span>
                    <span>{result.token.platform}</span>
                  </div>
                </div>
              </div>

              {/* Category bars */}
              <div className="space-y-3 py-3"
                style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}>
                {result.categories.map((cat, i) => (
                  <CategoryBar key={cat.category} label={cat.label} score={cat.score} delay={i * 0.1} />
                ))}
              </div>

              {/* Recommendation */}
              <div className="font-mono text-[10px] leading-relaxed px-3 py-2 rounded-sm"
                style={{ background: resultColor + "08", border: `0.5px solid ${resultColor}20`, color: "rgba(255,255,255,0.5)" }}>
                <span style={{ color: resultColor + "80" }}>REC // </span>
                {result.recommendation}
              </div>

              {/* Flags */}
              {result.flags.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-[9px] tracking-[0.2em] uppercase"
                    style={{ color: "rgba(255,255,255,0.2)" }}>
                    Risk Vectors ({result.flags.length})
                  </div>
                  {result.flags.map((f, i) => (
                    <FlagChip key={f.id} flag={f} idx={i} />
                  ))}
                </div>
              )}

              {result.flags.length === 0 && (
                <div className="font-mono text-[11px] px-3 py-3 text-center"
                  style={{ border: "0.5px solid rgba(0,255,136,0.2)", color: "#00ff88", background: "rgba(0,255,136,0.04)" }}>
                  ✓ ZERO FLAGS — CLEAN PROFILE
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer */}
      {state === "complete" && result && (
        <div className="px-4 py-2 flex items-center justify-between flex-shrink-0"
          style={{ borderTop: "0.5px solid rgba(255,255,255,0.04)" }}>
          <span className="font-mono text-[9px] tracking-widest" style={{ color: "rgba(255,255,255,0.15)" }}>
            {result.token.mint.slice(0, 20)}...
          </span>
          <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.15)" }}>
            {new Date(result.analyzedAt).toLocaleTimeString()} · {result.token.fetchMs}ms
          </span>
        </div>
      )}
    </div>
  );
}
