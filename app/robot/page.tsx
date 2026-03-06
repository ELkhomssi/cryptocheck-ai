'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import NeuralScannerView, { TerminalBoot, injectCSS } from '@/components/NeuralScannerView';
import LiveTransactionsFeed from '@/components/LiveTransactionsFeed';
import MarketDashboard from '@/components/MarketDashboard';
import { CopyAddress, ShareVerdict, GlobalSearchBar } from '@/components/TokenActions';

interface Signal {
  decision: string; confidence: number; reason: string;
  entry?: string; exit?: string; maxPosition: string; alerts: string[];
}
interface EngineResult {
  token: { name: string; symbol: string; liquidityUSD: number; mint: string };
  score: number; level: string; verdict: string;
  flags: { title: string; level: string }[];
}

const NEON = '#14f195';
const MUTED = 'rgba(255,255,255,0.25)';

// Inner component that uses useSearchParams (must be wrapped in Suspense)
function RobotInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [booted, setBooted] = useState(false);
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [portfolioInput, setPortfolioInput] = useState('');
  const [tab, setTab] = useState<'signal' | 'portfolio' | 'market'>('signal');
  const [scanned, setScanned] = useState(false);

  useEffect(() => { injectCSS(); }, []);

  // ── Read mint from URL on load ──
  useEffect(() => {
    const urlMint = searchParams.get('mint');
    if (urlMint && urlMint !== mint) {
      setMint(urlMint);
      setTab('signal');
      triggerAnalyze(urlMint);
    }
  }, []);

  // ── Update URL when mint changes ──
  const setMintAndUrl = (newMint: string) => {
    setMint(newMint);
    const params = new URLSearchParams();
    if (newMint) params.set('mint', newMint);
    router.replace(`/robot?${params.toString()}`, { scroll: false });
  };

  const triggerAnalyze = async (mintAddress: string) => {
    if (!mintAddress.trim()) return;
    setLoading(true); setError(''); setResult(null); setSignal(null); setScanned(false);
    try {
      const res = await fetch('/api/robot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint: mintAddress.trim(), action: 'analyze' }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setSignal(data.signal);
        setScanned(true);
      } else setError(data.error || 'Analysis failed');
    } catch { setError('Connection error. Check your API keys.'); }
    finally { setLoading(false); }
  };

  const analyze = () => {
    setMintAndUrl(mint);
    triggerAnalyze(mint);
  };

  const handleTokenSelect = (token: any) => {
    const addr = token.address || token.mint || '';
    setMintAndUrl(addr);
    setTab('signal');
    triggerAnalyze(addr);
  };

  const addToPortfolio = () => {
    if (portfolioInput.trim() && !portfolio.includes(portfolioInput.trim())) {
      setPortfolio([...portfolio, portfolioInput.trim()]);
      setPortfolioInput('');
    }
  };

  return (
    <>
      {!booted && <TerminalBoot onDone={() => setBooted(true)} />}

      <div style={{
        minHeight: '100dvh', background: '#030507',
        color: 'rgba(255,255,255,0.85)',
        fontFamily: "'Share Tech Mono', monospace",
        opacity: booted ? 1 : 0, transition: 'opacity 0.5s ease',
      }}>
        {/* Ambient glow */}
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, background: 'radial-gradient(ellipse 60% 40% at 50% 0%,rgba(20,241,149,0.04),transparent 70%)' }} />

        {/* ── HEADER ── */}
        <header style={{
          height: 48, position: 'sticky', top: 0, zIndex: 100,
          background: 'rgba(3,5,7,0.92)', backdropFilter: 'blur(16px)',
          borderBottom: '0.5px solid rgba(20,241,149,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '0 20px', gap: 12,
        }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 14, height: 14, border: '0.5px solid rgba(20,241,149,0.5)', background: 'rgba(20,241,149,0.05)', transform: 'rotate(45deg)', boxShadow: '0 0 8px rgba(20,241,149,0.3)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: NEON, fontFamily: "'Orbitron',monospace", letterSpacing: 2 }}>CRYPTOCHECK</span>
          </a>

          {/* Global search — center */}
          <div style={{ flex: 1, maxWidth: 340 }}>
            <GlobalSearchBar onSelect={handleTokenSelect} />
          </div>

          {/* Nav */}
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            {(['signal', 'portfolio', 'market'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                padding: '4px 12px', fontFamily: "'Share Tech Mono',monospace",
                fontSize: 9, letterSpacing: 2, border: '0.5px solid',
                borderColor: tab === t ? 'rgba(20,241,149,0.4)' : 'rgba(255,255,255,0.06)',
                color: tab === t ? NEON : MUTED,
                background: tab === t ? 'rgba(20,241,149,0.06)' : 'transparent',
                borderRadius: 2, cursor: 'pointer', transition: 'all 0.2s',
              }}>
                {t === 'signal' ? '🤖 AI' : t === 'portfolio' ? '📊' : '📈'}
              </button>
            ))}
            <a href="/" style={{ padding: '4px 10px', fontSize: 9, color: MUTED, textDecoration: 'none', border: '0.5px solid rgba(255,255,255,0.06)', letterSpacing: 1, borderRadius: 2 }}>←</a>
          </div>
        </header>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 20px', position: 'relative', zIndex: 1 }}>
          <AnimatePresence mode="wait">

            {/* ── AI SIGNAL TAB ── */}
            {tab === 'signal' && (
              <motion.div key="signal"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
              >
                <div style={{ marginBottom: 28 }}>
                  <div style={{ fontSize: 9, letterSpacing: 4, color: MUTED, marginBottom: 6 }}>AI TRADING SIGNAL</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Orbitron',monospace", letterSpacing: 2 }}>
                    GPT-4 <span style={{ color: NEON, textShadow: '0 0 20px rgba(20,241,149,0.4)' }}>Token Analysis</span>
                  </div>
                </div>

                {/* Input row */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(20,241,149,0.35)', fontSize: 12 }}>$</span>
                    <input
                      value={mint}
                      onChange={e => setMint(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && analyze()}
                      placeholder="Paste Solana mint address..."
                      style={{
                        width: '100%', boxSizing: 'border-box',
                        background: '#070d0f', border: '0.5px solid rgba(20,241,149,0.15)',
                        color: NEON, fontFamily: "'Share Tech Mono',monospace",
                        fontSize: 12, padding: '11px 14px 11px 28px',
                        outline: 'none', borderRadius: 2, transition: 'all 0.2s',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(20,241,149,0.45)'; e.target.style.boxShadow = '0 0 16px rgba(20,241,149,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(20,241,149,0.15)'; e.target.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <button
                    onClick={analyze} disabled={loading}
                    className="buy-btn"
                    style={{
                      padding: '11px 24px', background: loading ? 'transparent' : 'rgba(20,241,149,0.08)',
                      border: '0.5px solid rgba(20,241,149,0.35)',
                      color: loading ? MUTED : NEON,
                      fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 3,
                      cursor: loading ? 'not-allowed' : 'pointer', borderRadius: 2,
                    }}
                  >
                    {loading ? 'SCANNING...' : 'ANALYZE →'}
                  </button>
                </div>

                {/* Token info bar — shows after scan */}
                {scanned && result && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 16px', marginBottom: 16,
                      background: 'rgba(20,241,149,0.03)',
                      border: '0.5px solid rgba(20,241,149,0.12)',
                      borderRadius: 4, flexWrap: 'wrap', gap: 8,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>{result.token.name}</span>
                      <span style={{ color: MUTED, fontSize: 11 }}>${result.token.symbol}</span>
                      <CopyAddress address={result.token.mint} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <ShareVerdict
                        symbol={result.token.symbol}
                        score={result.score}
                        mint={result.token.mint}
                        level={result.level}
                      />
                    </div>
                  </motion.div>
                )}

                {error && (
                  <div style={{ padding: 12, background: 'rgba(255,34,68,0.06)', border: '0.5px solid rgba(255,34,68,0.2)', color: '#ff2244', fontSize: 11, marginBottom: 16, borderRadius: 2 }}>
                    ⚠ {error}
                  </div>
                )}

                {/* Terminal window */}
                <div style={{ background: '#070d0f', border: '0.5px solid rgba(20,241,149,0.1)', borderRadius: 6, overflow: 'hidden', boxShadow: '0 0 40px rgba(0,0,0,0.5)', marginBottom: 20 }}>
                  <div style={{ height: 32, background: 'rgba(0,0,0,0.4)', borderBottom: '0.5px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 14px' }}>
                    {['#ff5f57', '#febc2e', '#28c840'].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.8 }} />)}
                    <span style={{ marginLeft: 8, fontSize: 9, color: MUTED, letterSpacing: 3 }}>NEURAL VERDICT TERMINAL</span>
                    {loading && (
                      <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
                        {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: NEON, animation: `textBlink 1s ease ${i * 0.2}s infinite` }} />)}
                      </div>
                    )}
                    {/* URL share */}
                    {scanned && (
                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, fontFamily: 'monospace' }}>
                          /robot?mint={mint.slice(0, 12)}...
                        </span>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: 24, minHeight: 280 }}>
                    <NeuralScannerView result={result} signal={signal} scanning={loading} scanned={scanned} />
                  </div>
                </div>

                {/* Live transactions */}
                <AnimatePresence>
                  {scanned && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>
                      <div style={{ fontSize: 9, letterSpacing: 4, color: MUTED, marginBottom: 10 }}>LIVE TRANSACTIONS</div>
                      <LiveTransactionsFeed tokenPrice={0.001} useMockData={true} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ── PORTFOLIO TAB ── */}
            {tab === 'portfolio' && (
              <motion.div key="portfolio"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 9, letterSpacing: 4, color: MUTED, marginBottom: 6 }}>PORTFOLIO TRACKER</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Orbitron',monospace" }}>AI <span style={{ color: NEON }}>Portfolio</span></div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                  <input value={portfolioInput} onChange={e => setPortfolioInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && addToPortfolio()} placeholder="Add mint address..."
                    style={{ flex: 1, background: '#070d0f', border: '0.5px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', fontFamily: "'Share Tech Mono',monospace", fontSize: 11, padding: '10px 14px', outline: 'none', borderRadius: 2 }} />
                  <button onClick={addToPortfolio} className="buy-btn" style={{ padding: '10px 18px', background: 'rgba(20,241,149,0.08)', border: '0.5px solid rgba(20,241,149,0.3)', color: NEON, fontFamily: "'Share Tech Mono',monospace", fontSize: 10, cursor: 'pointer', borderRadius: 2 }}>ADD</button>
                </div>
                {portfolio.length === 0
                  ? <div style={{ textAlign: 'center', padding: 60, color: MUTED, fontSize: 11 }}>Add token addresses to track your portfolio</div>
                  : <div>
                    <AnimatePresence>
                      {portfolio.map((m, i) => (
                        <motion.div key={m} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.22 }}
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#070d0f', border: '0.5px solid rgba(255,255,255,0.04)', marginBottom: 4, borderRadius: 2 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <span style={{ fontSize: 11, color: MUTED }}>{m.slice(0, 24)}...</span>
                            <CopyAddress address={m} />
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleTokenSelect({ address: m })} style={{ background: 'rgba(20,241,149,0.06)', border: '1px solid rgba(20,241,149,0.15)', borderRadius: 4, padding: '3px 8px', color: NEON, fontSize: 9, cursor: 'pointer' }}>SCAN</button>
                            <button onClick={() => setPortfolio(portfolio.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#ff2244', cursor: 'pointer', fontSize: 12 }}>✕</button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    <button className="buy-btn" style={{ width: '100%', marginTop: 14, padding: 13, background: 'rgba(20,241,149,0.06)', border: '0.5px solid rgba(20,241,149,0.25)', color: NEON, fontFamily: "'Share Tech Mono',monospace", fontSize: 10, letterSpacing: 3, cursor: 'pointer', borderRadius: 2 }}>
                      ANALYZE PORTFOLIO WITH AI →
                    </button>
                  </div>
                }
              </motion.div>
            )}

            {/* ── MARKET TAB ── */}
            {tab === 'market' && (
              <motion.div key="market"
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }} transition={{ duration: 0.22 }}
              >
                <div style={{ marginBottom: 24 }}>
                  <div style={{ fontSize: 9, letterSpacing: 4, color: MUTED, marginBottom: 6 }}>MARKET OVERVIEW</div>
                  <div style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Orbitron',monospace" }}>Live <span style={{ color: NEON }}>Market Dashboard</span></div>
                </div>
                <MarketDashboard onTokenSelect={handleTokenSelect} />
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

// Wrap in Suspense for useSearchParams
export default function RobotPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100dvh', background: '#030507', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14f195', fontFamily: 'monospace', fontSize: 12, letterSpacing: 3 }}>
        LOADING...
      </div>
    }>
      <RobotInner />
    </Suspense>
  );
}
