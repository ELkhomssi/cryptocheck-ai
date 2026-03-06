"use client";

/**
 * CryptoCheck AI — components/LiveAlphaFeed.tsx
 * WebSocket-powered live token feed with auto-scan.
 * Obsidian & Cyber-Gold aesthetic.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import type { EngineResult } from "@/lib/engine";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface LiveEntry {
  id: string;
  mint: string;
  detectedAt: number;
  platform: "raydium" | "pump.fun" | "orca" | "unknown";
  status: "scanning" | "done" | "error";
  result?: EngineResult;
}

interface LiveAlphaFeedProps {
  accent?: string;
  onSelect?: (entry: LiveEntry) => void;
  maxEntries?: number;
}

// ─── WebSocket Hook ──────────────────────────────────────────────────────────

const RAYDIUM = "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8";
const PUMPFUN = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";

function useLiveFeed(maxEntries: number) {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [wsState, setWsState] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;

    const mint = queueRef.current.shift()!;
    try {
      const res = await fetch(`/api/analyze?mint=${encodeURIComponent(mint)}`);
      const json = await res.json();

      setEntries(prev =>
        prev.map(e =>
          e.mint === mint
            ? { ...e, status: json.success ? "done" : "error", result: json.success ? json.result : undefined }
            : e
        )
      );
    } catch {
      setEntries(prev => prev.map(e => e.mint === mint ? { ...e, status: "error" } : e));
    } finally {
      processingRef.current = false;
      setTimeout(processQueue, 250); // 250ms throttle
    }
  }, []);

  const addEntry = useCallback((mint: string, platform: LiveEntry["platform"]) => {
    const entry: LiveEntry = {
      id: `${mint}-${Date.now()}`,
      mint, platform,
      detectedAt: Date.now(),
      status: "scanning",
    };

    setEntries(prev => {
      if (prev.some(e => e.mint === mint)) return prev;
      return [entry, ...prev].slice(0, maxEntries);
    });

    queueRef.current.push(mint);
    processQueue();
  }, [maxEntries, processQueue]);

  const connect = useCallback(() => {
    const key = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    if (!key) return;

    const ws = new WebSocket(`wss://atlas-mainnet.helius-rpc.com/?api-key=${key}`);
    wsRef.current = ws;
    setWsState("connecting");

    ws.onopen = () => {
      setWsState("connected");
      ws.send(JSON.stringify({
        jsonrpc: "2.0", id: 1,
        method: "logsSubscribe",
        params: [
          { mentions: [RAYDIUM, PUMPFUN] },
          { commitment: "confirmed" },
        ],
      }));
    };

    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        const logs: string[] = msg?.params?.result?.value?.logs ?? [];
        const accounts: string[] = msg?.params?.result?.value?.transaction?.message?.accountKeys ?? [];

        const isNew = logs.some(l =>
          l.includes("InitializeMint") || l.includes("initialize2") || l.includes("MintTo")
        );
        if (!isNew || accounts.length < 2) return;

        const platform = logs.some(l => l.includes(PUMPFUN)) ? "pump.fun" : "raydium";
        const mint = accounts[1];
        if (!mint || mint.length < 32) return;
        addEntry(mint, platform);
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      setWsState("disconnected");
      reconnectRef.current = setTimeout(connect, 3000);
    };

    ws.onerror = () => ws.close();
  }, [addEntry]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { entries, wsState };
}

// ─── Score Badge ─────────────────────────────────────────────────────────────

const LEVEL_COLOR: Record<string, string> = {
  SAFE: "#00ff88", LOW: "#b4ff44",
  MEDIUM: "#ffb300", HIGH: "#ff6b35", CRITICAL: "#ff2244",
};

function ScoreBadge({ result, scanning }: { result?: EngineResult; scanning: boolean }) {
  const col = result ? (LEVEL_COLOR[result.level] ?? "#ffb300") : "#ffffff";

  if (scanning) {
    return (
      <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
        style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-4 h-4 rounded-full"
          style={{ border: "1.5px solid rgba(255,255,255,0.15)", borderTopColor: "#ffb30080" }}
        />
      </div>
    );
  }

  return (
    <div className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
      style={{
        background: col + "12",
        border: `0.5px solid ${col}25`,
        boxShadow: `0 0 12px ${col}15`,
      }}>
      <span className="font-mono text-sm font-bold" style={{ color: col }}>
        {result?.score ?? "—"}
      </span>
    </div>
  );
}

// ─── Feed Entry ──────────────────────────────────────────────────────────────

function FeedRow({
  entry, accent, onSelect, idx,
}: { entry: LiveEntry; accent: string; onSelect?: (e: LiveEntry) => void; idx: number }) {
  const isNew = Date.now() - entry.detectedAt < 3000;
  const col = entry.result ? (LEVEL_COLOR[entry.result.level] ?? accent) : accent;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -12, height: 0 }}
      animate={{ opacity: 1, x: 0, height: "auto" }}
      exit={{ opacity: 0, x: 12, height: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 35 }}
      onClick={() => entry.status === "done" && onSelect?.(entry)}
      className="group relative flex items-center gap-2.5 px-3 py-2.5 cursor-pointer transition-all duration-150"
      style={{
        borderBottom: "0.5px solid rgba(255,255,255,0.03)",
        background: isNew ? `${accent}06` : "transparent",
      }}
    >
      {/* New pulse indicator */}
      {isNew && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          className="absolute left-0 top-0 bottom-0 w-[1.5px]"
          style={{ background: accent, transformOrigin: "left", boxShadow: `0 0 6px ${accent}` }}
        />
      )}

      <ScoreBadge result={entry.result} scanning={entry.status === "scanning"} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-mono text-[12px] font-bold truncate"
            style={{ color: "rgba(255,255,255,0.8)" }}>
            {entry.result?.token.name ?? entry.mint.slice(0, 8) + "..."}
          </span>
          {entry.result && (
            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0"
              style={{ background: col + "15", color: col + "cc", border: `0.5px solid ${col}25` }}>
              {entry.result.token.symbol}
            </span>
          )}
          <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm flex-shrink-0 ${
            entry.platform === "pump.fun" ? "" : ""
          }`}
            style={{
              background: entry.platform === "pump.fun" ? "rgba(255,179,0,0.1)" : "rgba(99,102,241,0.1)",
              color: entry.platform === "pump.fun" ? "#ffb30080" : "#818cf880",
              border: `0.5px solid ${entry.platform === "pump.fun" ? "rgba(255,179,0,0.15)" : "rgba(99,102,241,0.15)"}`,
            }}>
            {entry.platform}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5 font-mono text-[10px]"
          style={{ color: "rgba(255,255,255,0.2)" }}>
          {entry.result ? (
            <>
              <span>💧 ${(entry.result.token.liquidityUSD / 1000).toFixed(0)}k</span>
              <span>·</span>
              <span style={{ color: col + "80" }}>{entry.result.level}</span>
            </>
          ) : (
            <span>Scanning on-chain data...</span>
          )}
          <span className="ml-auto">{Math.floor((Date.now() - entry.detectedAt) / 1000)}s</span>
        </div>
      </div>

      {/* Hover arrow */}
      {entry.status === "done" && (
        <span className="font-mono text-[10px] opacity-0 group-hover:opacity-30 transition-opacity flex-shrink-0"
          style={{ color: accent }}>
          →
        </span>
      )}
    </motion.div>
  );
}

// ─── Connection Status Indicator ─────────────────────────────────────────────

function WsStatus({ state, accent, count }: { state: string; accent: string; count: number }) {
  const stateMap = {
    connecting:   { label: "CONNECTING", color: "#ffb300" },
    connected:    { label: "LIVE", color: "#00ff88" },
    disconnected: { label: "OFFLINE", color: "#ff2244" },
  };
  const s = stateMap[state as keyof typeof stateMap] ?? stateMap.disconnected;

  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={state === "connected" ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
        transition={{ repeat: Infinity, duration: 1.5 }}
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: s.color, boxShadow: `0 0 4px ${s.color}` }}
      />
      <span className="font-mono text-[9px] tracking-[0.15em]" style={{ color: s.color + "80" }}>
        {s.label}
      </span>
      {count > 0 && (
        <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
          {count} detected
        </span>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function LiveAlphaFeed({ accent = "#ffb300", onSelect, maxEntries = 40 }: LiveAlphaFeedProps) {
  const { entries, wsState } = useLiveFeed(maxEntries);
  const [filter, setFilter] = useState<"all" | "pump.fun" | "raydium">("all");
  const [scoreFilter, setScoreFilter] = useState<number>(0);

  const filtered = entries.filter(e => {
    if (filter !== "all" && e.platform !== filter) return false;
    if (scoreFilter > 0 && e.result && e.result.score < scoreFilter) return false;
    return true;
  });

  return (
    <div className="flex flex-col h-full"
      style={{
        background: "rgba(8,8,8,0.97)",
        border: `0.5px solid ${accent}20`,
        borderRadius: 2,
      }}>

      {/* Header */}
      <div className="px-3 py-3 flex-shrink-0"
        style={{ borderBottom: `0.5px solid rgba(255,255,255,0.05)` }}>
        <div className="flex items-center justify-between mb-2">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase"
            style={{ color: "rgba(255,255,255,0.25)" }}>
            ALPHA FEED
          </span>
          <WsStatus state={wsState} accent={accent} count={entries.length} />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5">
          {(["all", "pump.fun", "raydium"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className="px-2 py-0.5 font-mono text-[9px] tracking-widest uppercase transition-all"
              style={{
                color: filter === f ? accent : "rgba(255,255,255,0.2)",
                border: `0.5px solid ${filter === f ? accent + "40" : "rgba(255,255,255,0.06)"}`,
                background: filter === f ? accent + "08" : "transparent",
                borderRadius: 1,
              }}>
              {f}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1">
            <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>≥</span>
            <input
              type="number" min={0} max={100} value={scoreFilter || ""}
              onChange={e => setScoreFilter(Number(e.target.value) || 0)}
              placeholder="score"
              className="w-12 bg-transparent font-mono text-[9px] outline-none text-center"
              style={{ color: accent, border: `0.5px solid rgba(255,255,255,0.06)`, borderRadius: 1, padding: "1px 4px" }}
            />
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex-1 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${accent}10 transparent` }}>
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
            <motion.div
              animate={{ opacity: [0.3, 0.7, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="font-mono text-[28px]" style={{ color: accent + "30" }}>
              ◈
            </motion.div>
            <div className="font-mono text-[9px] tracking-[0.2em]"
              style={{ color: "rgba(255,255,255,0.15)" }}>
              {wsState === "connected" ? "MONITORING CHAIN..." : "ESTABLISHING CONNECTION..."}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {filtered.map((entry, idx) => (
            <FeedRow
              key={entry.id}
              entry={entry}
              accent={accent}
              onSelect={onSelect}
              idx={idx}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Stats footer */}
      {entries.length > 0 && (
        <div className="px-3 py-2 flex items-center gap-3 flex-shrink-0"
          style={{ borderTop: `0.5px solid rgba(255,255,255,0.04)` }}>
          {[
            { label: "SAFE", count: entries.filter(e => e.result?.level === "SAFE" || e.result?.level === "LOW").length, col: "#00ff88" },
            { label: "RISK", count: entries.filter(e => e.result?.level === "HIGH" || e.result?.level === "CRITICAL").length, col: "#ff2244" },
            { label: "SCAN", count: entries.filter(e => e.status === "scanning").length, col: "#ffb300" },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full" style={{ background: s.col }} />
              <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                {s.label} <span style={{ color: s.col + "80" }}>{s.count}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LiveAlphaFeed;
