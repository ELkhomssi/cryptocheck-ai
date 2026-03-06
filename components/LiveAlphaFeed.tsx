'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EngineResult } from '@/lib/engine';

export interface LiveEntry {
  id: string;
  mint: string;
  detectedAt: number;
  platform: 'raydium' | 'pump.fun' | 'orca' | 'unknown';
  status: 'scanning' | 'done' | 'error';
  result?: EngineResult;
}

const LEVEL_COLOR: Record<string, string> = {
  SAFE: '#00ff88', LOW: '#b4ff44', MEDIUM: '#ffb300', HIGH: '#ff6b35', CRITICAL: '#ff2244',
};

const DEMO_TOKENS = [
  { mint: 'So11111111111111111111111111111111111111112', platform: 'raydium' as const },
  { mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', platform: 'raydium' as const },
  { mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNky13McCe8BenwNYB', platform: 'raydium' as const },
  { mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', platform: 'pump.fun' as const },
  { mint: 'mSoLzYCxHdyJRkTeKWZkVJpJMGFWtM8SqQbqePRmVA8', platform: 'raydium' as const },
];

function useLiveFeed(maxEntries: number) {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const [wsState, setWsState] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const wsRef = useRef<WebSocket | null>(null);
  const queueRef = useRef<string[]>([]);
  const processingRef = useRef<boolean>(false);
  
  // تصحيح أنواع البيانات للـ Refs
  const reconnectRef = useRef<NodeJS.Timeout | null>(null);
  const demoRef = useRef<NodeJS.Timeout | string | number | undefined>(undefined);
  const demoIdxRef = useRef<number>(0);

  const processQueue = useCallback(async () => {
    if (processingRef.current || queueRef.current.length === 0) return;
    processingRef.current = true;
    const mint = queueRef.current.shift()!;
    const id = mint.slice(0, 8) + Date.now();

    setEntries(prev => {
      const entry: LiveEntry = {
        id, mint, detectedAt: Date.now(),
        platform: 'raydium', status: 'scanning',
      };
      return [entry, ...prev].slice(0, maxEntries);
    });

    try {
      const res = await fetch('/api/analyze?mint=' + mint);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      const result: EngineResult = json.result;
      setEntries(prev => prev.map(e => e.id === id ? { ...e, status: 'done', result } : e));
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
        const entry: LiveEntry = {
          id: token.mint + Date.now(), mint: token.mint,
          detectedAt: Date.now(), platform: token.platform, status: 'scanning',
        };
        return [entry, ...prev].slice(0, maxEntries);
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
      
      const timeout = setTimeout(() => { 
        ws.close(); 
        startDemo(); 
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        setWsState('connected');
        ws.send(JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'transactionSubscribe',
          params: [{ failed: false }, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 }],
        }));
      };
      
      ws.onmessage = (e) => {
        try {
          const d = JSON.parse(e.data);
          const accounts: string[] = d?.params?.result?.transaction?.message?.accountKeys ?? [];
          accounts.slice(0, 3).forEach((mint: string) => {
            if (mint.length >= 32 && mint.length <= 44) enqueue(mint);
          });
        } catch { /* ignore */ }
      };
      
      ws.onerror = () => { 
        clearTimeout(timeout); 
        startDemo(); 
      };
      
      ws.onclose = () => {
        setWsState('disconnected');
        // تصحيح التعيين لتفادي خطأ null
        reconnectRef.current = setTimeout(connect, 5000);
      };
    } catch {
      startDemo();
    }
  }, [enqueue, startDemo]);

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
      if (demoRef.current) clearInterval(demoRef.current as NodeJS.Timeout);
    };
  }, [connect]);

  return { entries, wsState };
}

const THEME = {
  bg: '#030303', surface: '#080808',
  border: 'rgba(255,255,255,0.04)',
  gold: '#ffb300', text: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.25)', dim: 'rgba(255,255,255,0.08)',
};

interface Props {
  onScan?: (mint: string) => void;
  accent?: string;
}

export default function LiveAlphaFeed({ onScan, accent = THEME.gold }: Props) {
  const [filter, setFilter] = useState<'all' | 'pump.fun' | 'raydium'>('all');
  const { entries, wsState } = useLiveFeed(40);

  const filtered = entries.filter(e => filter === 'all' || e.platform === filter);
  const safe = entries.filter(e => e.result?.level === 'SAFE' || e.result?.level === 'LOW').length;
  const rugs = entries.filter(e => e.result?.level === 'CRITICAL' || e.result?.level === 'HIGH').length;
  const statusColor = wsState === 'connected' ? '#00ff88' : '#ffb300';
  const statusLabel = wsState === 'connected' ? 'LIVE' : wsState === 'connecting' ? 'CONNECTING' : 'DEMO';

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: THEME.bg }}>
      <div style={{ padding: '10px 12px', borderBottom: '0.5px solid ' + THEME.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.2em', color: THEME.muted }}>ALPHA FEED</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: statusColor }} />
          <span style={{ fontSize: 8, color: statusColor, letterSpacing: '0.15em' }}>{statusLabel}</span>
        </div>
      </div>

      <div style={{ padding: '6px 8px', borderBottom: '0.5px solid ' + THEME.border, display: 'flex', gap: 4 }}>
        {(['all', 'pump.fun', 'raydium'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{ flex: 1, padding: '3px 0', fontFamily: 'monospace', fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', border: '0.5px solid', borderColor: filter === f ? accent + '40' : THEME.border, color: filter === f ? accent : THEME.muted, background: filter === f ? accent + '08' : 'transparent', borderRadius: 1, cursor: 'pointer' }}>
            {f === 'all' ? 'ALL' : f.toUpperCase()}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        <AnimatePresence initial={false}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', fontSize: 9, color: THEME.muted }}>
              {wsState === 'connecting' ? 'ESTABLISHING CONNECTION...' : 'WAITING FOR TOKENS...'}
            </div>
          ) : filtered.map(entry => (
            <motion.div key={entry.id}
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              onClick={() => entry.status === 'done' && onScan?.(entry.mint)}
              style={{ padding: '8px 12px', borderBottom: '0.5px solid ' + THEME.border, cursor: entry.status === 'done' ? 'pointer' : 'default' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 9, color: THEME.muted, fontFamily: 'monospace' }}>{entry.mint.slice(0, 12)}...</span>
                {entry.status === 'scanning' && <span style={{ fontSize: 7, color: accent, letterSpacing: '0.1em' }}>SCANNING</span>}
                {entry.status === 'done' && entry.result && (
                  <span style={{ fontSize: 8, fontWeight: 700, color: LEVEL_COLOR[entry.result.level] ?? THEME.muted }}>{entry.result.level}</span>
                )}
                {entry.status === 'error' && <span style={{ fontSize: 7, color: '#ff2244' }}>ERR</span>}
              </div>
              {entry.status === 'done' && entry.result && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ flex: 1, height: 2, background: THEME.dim, borderRadius: 1 }}>
                    <div style={{ width: entry.result.score + '%', height: '100%', background: LEVEL_COLOR[entry.result.level] ?? THEME.muted, borderRadius: 1 }} />
                  </div>
                  <span style={{ fontSize: 8, color: THEME.muted }}>{entry.result.score}</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div style={{ padding: '6px 12px', borderTop: '0.5px solid ' + THEME.border, display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 8, color: '#00ff88' }}>SAFE: {safe}</span>
        <span style={{ fontSize: 8, color: THEME.muted }}>SCAN: {entries.filter(e => e.status === 'scanning').length}</span>
        <span style={{ fontSize: 8, color: '#ff2244' }}>RUG: {rugs}</span>
      </div>
    </div>
  );
}
export { LiveAlphaFeed as default };
