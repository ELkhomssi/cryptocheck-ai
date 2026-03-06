'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { EngineResult } from '@/lib/engine';

// 1. التعريفات الأساسية
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

const LEVEL_COLOR: Record<string, string> = {
  SAFE: '#00ff88', LOW: '#b4ff44', MEDIUM: '#ffb300', HIGH: '#ff6b35', CRITICAL: '#ff2244',
};

// 2. Component ديال السطر الواحد (FeedRow)
function FeedRow({ entry, accent, onSelect }: { entry: LiveEntry, accent: string, onSelect?: (mint: string) => void }) {
  const isSafe = entry.result?.level === 'SAFE';
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => entry.status === 'done' && onSelect?.(entry.mint)}
      className={`group relative flex items-center justify-between p-3 mb-2 cursor-pointer rounded border transition-all ${
        isSafe ? 'bg-emerald-500/5 border-emerald-500/20 shadow-[0_0_10px_rgba(0,255,136,0.05)]' : 'bg-white/5 border-white/5'
      } hover:border-emerald-500/40`}
    >
      <div className="flex flex-col">
        <span className="text-[10px] font-mono text-white/50">{entry.mint.slice(0, 12)}...</span>
        <span className="text-[9px] text-white/30 uppercase">{entry.platform}</span>
      </div>
      
      {entry.status === 'scanning' ? (
        <div className="flex h-2 w-2 relative">
          <span className="animate-ping absolute h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative rounded-full h-2 w-2 bg-amber-500"></span>
        </div>
      ) : (
        <span className="text-[10px] font-bold" style={{ color: LEVEL_COLOR[entry.result?.level || ''] }}>
          {entry.result?.score ?? '--'}
        </span>
      )}
    </motion.div>
  );
}

// 3. الـ Component الرئيسي
export default function LiveAlphaFeed({ onScan, accent = '#ffb300' }: LiveAlphaFeedProps) {
  const [entries, setEntries] = useState<LiveEntry[]>([]);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // محاكاة البيانات (يمكن تعويضها بـ WebSocket لاحقاً)
  useEffect(() => {
    const interval = setInterval(() => {
      const id = Math.random().toString(36).substring(7);
      const newEntry: LiveEntry = {
        id, mint: 'So111...Demo' + id, detectedAt: Date.now(),
        platform: 'raydium', status: 'done',
        result: { score: Math.floor(Math.random() * 40) + 60, level: 'SAFE' } as any
      };
      setEntries(prev => [newEntry, ...prev].slice(0, 15));
    }, 4000);
    return () => {
      clearInterval(interval);
      if (reconnectRef.current) clearTimeout(reconnectRef.current);
    };
  }, []);

  return (
    <div className="flex flex-col h-full bg-[#030303] border-r border-white/5">
      <div className="p-4 border-b border-white/5 flex justify-between items-center">
        <span className="text-[10px] tracking-[0.2em] text-white/40 uppercase font-bold">Alpha Feed</span>
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[9px] text-emerald-500">LIVE</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <AnimatePresence initial={false}>
          {entries.map((entry) => (
            <FeedRow 
              key={entry.id} 
              entry={entry} 
              accent={accent} 
              onSelect={onScan} // هنا ربطنا onScan بـ onSelect ديال السطر
            />
          ))}
        </AnimatePresence>
      </div>
      
      <div className="p-3 border-t border-white/5 bg-black/20">
        <div className="flex justify-between text-[9px] text-white/40 font-mono">
          <span>SAFE: {entries.filter(e => e.result?.level === 'SAFE').length}</span>
          <span>SCANNED: {entries.length}</span>
        </div>
      </div>
    </div>
  );
}