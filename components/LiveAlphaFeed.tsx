'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Zap, TrendingUp, Radio, Wifi, WifiOff } from 'lucide-react';
import type { EngineResult } from '@/lib/engine';

export interface LiveEntry {
  id: string;
  mint: string;
  detectedAt: number;
  platform: 'raydium' | 'pump.fun' | 'orca' | 'unknown';
  status: 'scanning' | 'done' | 'error';
  result?: EngineResult;
}

interface LiveAlphaFeedProps {
  onScan?: (mint: string) => void;
  accent?: string;
}

const DEMO_TOKENS = [
  { mint: 'So11111111111111111111111111111111111111112', platform: 'raydium' as const },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', platform: 'raydium' as const },
  { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', platform: 'pump.fun' as const },
  { mint: 'mSoLzYCxHdyJRkTeKWZkVJpJMGFWtM8SqQbqePRmVA8', platform: 'raydium' as const },
];

const LEVEL_CONFIG: Record<string, { color: string; bg: string; icon: React.ReactNode; label: string }> = {
  SAFE:     { color: '#00ff88', bg: 'rgba(0,255,136,0.06)',  icon: <Shield size={9} />,        label: 'SAFE' },
  LOW:      { color: '#7fff00', bg: 'rgba(127,255,0,0.06)', icon: <TrendingUp size={9} />,    label: 'LOW'  },
  MEDIUM:   { color: '#ffb300', bg: 'rgba(255,179,0,0.06)', icon: <AlertTriangle size={9} />, label: 'MED'  },
  HIGH:     { color: '#ff6b35', bg: 'rgba(255,107,53,0.06)',icon: <AlertTriangle size={9} />, label: 'HIGH' },
  CRITICAL: { color: '#ff2244', bg: 'rgba(255,34,68,0.06)', icon: <Zap size={9} />,           label: 'RUG'  },
};

function RadarPing() {
  return (
    <div style={{ position: 'relative', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div animate={{ scale: [1, 1.8], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.2 }}
        style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', border: '1px solid #00d4ff' }} />
      <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#00d4ff', boxShadow: '0 0 6px #00d4ff' }} />
    </div>
  );
}

function ScoreArc({ score, color }: { score: number; color: string }) {
  const r = 11; const circ = 2 * Math.PI * r;
  return (
    <svg width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
      <motion.circle cx="14" cy="14" r={r} fill="none" stroke={color} strokeWidth="2"
        strokeDasharray={`${(score / 100) * circ} ${circ}`} strokeLinecap="round"
        transform="rotate(-90 14 14)"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${(score / 100) * circ} ${circ}` }}
        transition={{ duration: 0.8 }}
        style={{ filter: `drop-shadow(0 0 3px ${color})` }} />
      <text x="14" y="18" textAnchor="middle" fill={color} fontSize="7" fontFamily="monospace" fontWeight="bold">{score}</text>
    </svg>
  );
}

function useLiveFeed(maxEntries: number) {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [wsState, setWsState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef<boolean>(false);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const demoRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const demoIdxRef = useRef<number>(0);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;
    const mint = queueRef.current.shift()!;
    const id = mint.slice(0, 8) + Date.now();
    setEntries(prev => [{ id, mint, detectedAt: Date.now(), platform: 'raydium' as const, status: 'scanning' as const }, ...prev].slice(0, maxEntries));
    try {
      const res = await fetch('/api/analyze?mint=' + mint);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'done', result: json.result } : e));
    } catch {
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'error' } : e));
    }
    processingRef.current = false;
    setTimeout(processQueue, 500);
  }, [maxEntries]);

  const enqueue = useCallback((mint: string) => {
    if (queueRef.current.includes(mint)) return;
    queueRef.current.push(mint);
    processQueue();
  }, [processQueue]);

  const startDemo = useCallback(() => {
    setWsState('disconnected');
    if (demoRef.current) return;
    demoRef.current = setInterval(() => {
      const token = DEMO_TOKENS[demoIdxRef.current % DEMO_TOKENS.length];
      demoIdxRef.current++;
      setEntries(prev => {
        if (prev.some(e => e.mint === token.mint)) return prev;
        return [{ id: token.mint + Date.now(), mint: token.mint, detectedAt: Date.now(), platform: token.platform, status: 'scanning' as const }, ...prev].slice(0, maxEntries);
      });
      enqueue(token.mint);
    }, 3000);
  }, [enqueue, maxEntries]);

  const connect = useCallback(() => {
    const apiKey = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
    if (!apiKey) { startDemo(); return; }
    try {
      const ws = new WebSocket(`wss://atlas-mainnet.helius-rpc.com/?api-key=${apiKey}`);
      wsRef.current = ws;
      const t = setTimeout(() => { ws.close(); startDemo(); }, 5000);
      ws.onopen = () => { clearTimeout(t); setWsState('connected'); ws.send(JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'transactionSubscribe', params: [{ failed: false }, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }] })); };
      ws.onmessage = (e) => { try { const d = JSON.parse(e.data); (d?.params?.result?.transaction?.message?.accountKeys ?? []).slice(0, 3).forEach((m: string) => { if (m.length >= 32 && m.length <= 44) enqueue(m); }); } catch { /* ignore */ } };
      ws.onerror = () => { clearTimeout(t); startDemo(); };
      ws.onclose = () => { setWsState('disconnected'); reconnectRef.current = setTimeout(connect, 5000); };
    } catch { startDemo(); }
  }, [enqueue, startDemo]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (demoRef.current) clearInterval(demoRef.current);
    };
  }, [connect]);

  return { entries, wsState };
}

export default function LiveAlphaFeed({ onScan, accent = '#00d4ff' }: LiveAlphaFeedProps) {
  const [filter, setFilter] = useState<'all' | 'pump.fun' | 'raydium'>('all');
  const { entries, wsState } = useLiveFeed(40);
  const filtered = entries.filter(e => filter === 'all' || e.platform === filter);
  const safe = entries.filter(e => e.result?.level === 'SAFE' || e.result?.level === 'LOW').length;
  const rugs = entries.filter(e => e.result?.level === 'CRITICAL' || e.result?.level === 'HIGH').length;

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgba(3,3,3,0.97)', backdropFilter: 'blur(20px)', border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.04) 2px,rgba(0,0,0,0.04) 4px)' }} />
      
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Radio size={9} color={accent} />
          <span style={{ fontSize: 9, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>ALPHA FEED</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          {wsState === 'connected' ? <Wifi size={8} color="#00ff88" /> : <WifiOff size={8} color="#ffb300" />}
          <motion.div animate={{ opacity: wsState === 'connected' ? [1, 0.3, 1] : 1 }} transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ width: 4, height: 4, borderRadius: '50%', background: wsState === 'connected' ? '#00ff88' : '#ffb300', boxShadow: wsState === 'connected' ? '0 0 5px #00ff88' : '0 0 5px #ffb300' }} />
          <span style={{ fontSize: 7, color: wsState === 'connected' ? '#00ff88' : '#ffb300', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
            {wsState === 'connected' ? 'LIVE' : wsState === 'connecting' ? 'SYNC' : 'DEMO'}
          </span>
        </div>
      </div>

      {/* Stats */}
      <div style={{ padding: '5px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.04)', display: 'flex', gap: 8 }}>
        {[{ l: 'SAFE', v: safe, c: '#00ff88' }, { l: 'SCAN', v: entries.filter(e => e.status === 'scanning').length, c: accent }, { l: 'RUG', v: rugs, c: '#ff2244' }].map(s => (
          <div key={s.l} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.c, fontFamily: 'monospace', textShadow: `0 0 8px ${s.c}` }}>{s.v}</div>
            <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.1em' }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ padding: '5px 8px', borderBottom: '0.5px solid rgba(255,255,255,0.04)', display: 'flex', gap: 3 }}>
        {(['all', 'pump.fun', 'raydium'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ flex: 1, padding: '3px 0', fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', border: '0.5px solid', borderColor: filter === f ? accent + '50' : 'rgba(255,255,255,0.05)', color: filter === f ? accent : 'rgba(255,255,255,0.2)', background: filter === f ? accent + '10' : 'transparent', borderRadius: 2, cursor: 'pointer', boxShadow: filter === f ? `0 0 8px ${accent}15` : 'none' }}>
            {f === 'all' ? 'ALL' : f === 'pump.fun' ? 'PUMP' : 'RAY'}
          </button>
        ))}
      </div>

      {/* Feed */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center' }}>
              <motion.div animate={{ opacity: [0.3, 0.8, 0.3] }} transition={{ repeat: Infinity, duration: 2 }} style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                <Radio size={18} color={accent} />
              </motion.div>
              <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace', letterSpacing: '0.1em' }}>SCANNING CHAIN...</div>
            </div>
          ) : filtered.map((entry, i) => {
            const cfg = entry.result ? LEVEL_CONFIG[entry.result.level] : null;
            return (
              <motion.div key={entry.id}
                initial={{ opacity: 0, x: -16, height: 0 }}
                animate={{ opacity: 1, x: 0, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: 'spring', stiffness: 350, damping: 28, delay: i * 0.015 }}
                onClick={() => entry.status === 'done' && onScan?.(entry.mint)}
                whileHover={entry.status === 'done' ? { x: 2, backgroundColor: 'rgba(255,255,255,0.02)' } : {}}
                style={{ padding: '7px 12px', borderBottom: '0.5px solid rgba(255,255,255,0.03)', cursor: entry.status === 'done' ? 'pointer' : 'default', background: cfg ? cfg.bg : 'transparent', position: 'relative', overflow: 'hidden' }}
              >
                {cfg && <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: cfg.color, boxShadow: `0 0 5px ${cfg.color}` }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flexShrink: 0 }}>
                    {entry.status === 'scanning' ? <RadarPing /> : entry.result && cfg ? <ScoreArc score={entry.result.score} color={cfg.color} /> : <div style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 5, height: 5, borderRadius: '50%', background: '#ff2244' }} /></div>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>{entry.mint.slice(0, 10)}...</span>
                      {entry.status === 'scanning' && <motion.span animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} style={{ fontSize: 7, color: accent, fontFamily: 'monospace', letterSpacing: '0.1em' }}>SCANNING</motion.span>}
                      {cfg && <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}><span style={{ color: cfg.color, display: 'flex' }}>{cfg.icon}</span><span style={{ fontSize: 8, fontWeight: 700, color: cfg.color, fontFamily: 'monospace', textShadow: `0 0 5px ${cfg.color}` }}>{cfg.label}</span></div>}
                    </div>
                    {entry.result && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{entry.result.token?.name?.slice(0, 10) ?? '—'}</span>
                          <span style={{ fontSize: 7, color: entry.platform === 'pump.fun' ? '#ff6b35' : accent, fontFamily: 'monospace' }}>{entry.platform === 'pump.fun' ? 'PUMP' : 'RAY'}</span>
                        </div>
                        {cfg && <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 1 }}><motion.div initial={{ width: 0 }} animate={{ width: entry.result.score + '%' }} transition={{ duration: 0.8 }} style={{ height: '100%', background: `linear-gradient(90deg,${cfg.color}60,${cfg.color})`, borderRadius: 1, boxShadow: `0 0 4px ${cfg.color}` }} /></div>}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
