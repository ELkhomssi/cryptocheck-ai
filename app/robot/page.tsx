'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RiskAssessment from '@/src/components/RiskAssessment';
import LiveTransactionsFeed from '@/src/components/LiveTransactionsFeed';
import MarketDashboard from '@/src/components/MarketDashboard';

const THEME = {
  bg: '#030303', surface: '#080808',
  border: 'rgba(255,255,255,0.04)',
  gold: '#00d4ff', emerald: '#00ff88',
  red: '#ff2244', blue: '#4488ff',
  text: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.25)',
};

const DECISION_COLOR: Record<string, string> = {
  BUY: '#00ff88', SELL: '#ff2244', HOLD: '#00d4ff', AVOID: '#ff6b35',
};

interface Signal {
  decision: string; confidence: number; reason: string;
  entry?: string; exit?: string; maxPosition: string; alerts: string[];
}

interface EngineResult {
  token: { name: string; symbol: string; liquidityUSD: number; mint: string };
  score: number; level: string; verdict: string; flags: { title: string; level: string }[];
}

export default function RobotPage() {
  const [mint, setMint] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EngineResult | null>(null);
  const [signal, setSignal] = useState<Signal | null>(null);
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState<string[]>([]);
  const [portfolioInput, setPortfolioInput] = useState('');
  const [tab, setTab] = useState<'signal' | 'portfolio' | 'market'>('signal');
  const [analyzedMint, setAnalyzedMint] = useState('');

  const analyze = async () => {
    if (!mint.trim()) return;
    setLoading(true); setError(''); setResult(null); setSignal(null);
    try {
      const res = await fetch('/api/robot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mint: mint.trim(), action: 'analyze' }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        setSignal(data.signal);
        setAnalyzedMint(mint.trim());
      } else setError(data.error);
    } catch { setError('Connection error'); }
    finally { setLoading(false); }
  };

  const addToPortfolio = () => {
    if (portfolioInput.trim() && !portfolio.includes(portfolioInput.trim())) {
      setPortfolio([...portfolio, portfolioInput.trim()]);
      setPortfolioInput('');
    }
  };

  const decColor = signal ? (DECISION_COLOR[signal.decision] ?? THEME.gold) : THEME.gold;

  return (
    <div style={{ minHeight: '100dvh', background: THEME.bg, color: THEME.text, fontFamily: 'monospace' }}>
      <header style={{ height: 44, background: THEME.surface, borderBottom: '0.5px solid ' + THEME.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 16, height: 16, border: '0.5px solid ' + THEME.gold + '60', background: THEME.gold + '08', transform: 'rotate(45deg)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: THEME.gold }}>CRYPTOCHECK</span>
          <span style={{ fontSize: 9, color: THEME.muted, letterSpacing: '0.2em' }}>AI ROBOT</span>
        </a>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['signal', 'portfolio', 'market'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ padding: '4px 14px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', border: '0.5px solid', borderColor: tab === t ? THEME.gold + '40' : 'rgba(255,255,255,0.08)', color: tab === t ? THEME.gold : THEME.muted, background: tab === t ? THEME.gold + '08' : 'transparent', borderRadius: 1, cursor: 'pointer' }}>
              {t === 'signal' ? '🤖 AI Signal' : t === 'portfolio' ? '📊 Portfolio' : '📈 Market'}
            </button>
          ))}
          <a href="/" style={{ padding: '4px 14px', fontSize: 9, color: THEME.muted, textDecoration: 'none', border: '0.5px solid rgba(255,255,255,0.08)', letterSpacing: '0.1em' }}>← TERMINAL</a>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 24px' }}>

        {/* ── SIGNAL TAB ── */}
        {tab === 'signal' && (
          <>
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.3em', color: THEME.muted, marginBottom: 8 }}>AI TRADING SIGNAL</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: THEME.text }}>
                GPT-4 <span style={{ color: THEME.gold }}>Token Analysis</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
              <input value={mint} onChange={e => setMint(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && analyze()}
                placeholder="Enter Solana mint address..."
                style={{ flex: 1, background: THEME.surface, border: '0.5px solid rgba(255,255,255,0.08)', color: THEME.text, fontFamily: 'monospace', fontSize: 11, padding: '10px 14px', outline: 'none', borderRadius: 1 }} />
              <button onClick={analyze} disabled={loading}
                style={{ padding: '10px 24px', background: THEME.gold + '15', border: '0.5px solid ' + THEME.gold + '40', color: THEME.gold, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', cursor: 'pointer', borderRadius: 1 }}>
                {loading ? 'ANALYZING...' : 'ANALYZE →'}
              </button>
            </div>

            {error && <div style={{ padding: 16, background: '#ff224410', border: '0.5px solid #ff224430', color: '#ff2244', fontSize: 10, marginBottom: 16 }}>{error}</div>}

            <AnimatePresence>
              {signal && result && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  {/* Original signal cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div style={{ background: THEME.surface, border: '0.5px solid ' + decColor + '30', borderRadius: 2, padding: 24 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.2em', color: THEME.muted, marginBottom: 12 }}>AI DECISION</div>
                      <div style={{ fontSize: 36, fontWeight: 700, color: decColor, marginBottom: 8 }}>{signal.decision}</div>
                      <div style={{ fontSize: 10, color: THEME.muted, marginBottom: 16 }}>{signal.reason}</div>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <div>
                          <div style={{ fontSize: 8, color: THEME.muted, marginBottom: 2 }}>CONFIDENCE</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: decColor }}>{signal.confidence}%</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 8, color: THEME.muted, marginBottom: 2 }}>MAX POSITION</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: THEME.text }}>{signal.maxPosition}</div>
                        </div>
                      </div>
                    </div>

                    <div style={{ background: THEME.surface, border: '0.5px solid rgba(255,255,255,0.06)', borderRadius: 2, padding: 24 }}>
                      <div style={{ fontSize: 9, letterSpacing: '0.2em', color: THEME.muted, marginBottom: 12 }}>TOKEN PROFILE</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: THEME.text, marginBottom: 4 }}>{result.token.name}</div>
                      <div style={{ fontSize: 10, color: THEME.muted, marginBottom: 16 }}>{result.token.symbol} · {result.token.mint.slice(0, 12)}...</div>
                      <div style={{ display: 'flex', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 8, color: THEME.muted }}>SCORE</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: result.score >= 60 ? THEME.emerald : THEME.gold }}>{result.score}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 8, color: THEME.muted }}>TVL</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: THEME.text }}>${result.token.liquidityUSD >= 1000 ? (result.token.liquidityUSD / 1000).toFixed(0) + 'k' : result.token.liquidityUSD.toFixed(0)}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 8, color: THEME.muted }}>LEVEL</div>
                          <div style={{ fontSize: 18, fontWeight: 700, color: THEME.gold }}>{result.level}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(signal.entry || signal.exit) && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                      {signal.entry && (
                        <div style={{ background: THEME.surface, border: '0.5px solid ' + THEME.emerald + '20', borderRadius: 2, padding: 16 }}>
                          <div style={{ fontSize: 8, color: THEME.emerald, letterSpacing: '0.15em', marginBottom: 6 }}>ENTRY STRATEGY</div>
                          <div style={{ fontSize: 10, color: THEME.text }}>{signal.entry}</div>
                        </div>
                      )}
                      {signal.exit && (
                        <div style={{ background: THEME.surface, border: '0.5px solid ' + THEME.red + '20', borderRadius: 2, padding: 16 }}>
                          <div style={{ fontSize: 8, color: THEME.red, letterSpacing: '0.15em', marginBottom: 6 }}>EXIT STRATEGY</div>
                          <div style={{ fontSize: 10, color: THEME.text }}>{signal.exit}</div>
                        </div>
                      )}
                    </div>
                  )}

                  {signal.alerts.length > 0 && (
                    <div style={{ background: THEME.surface, border: '0.5px solid rgba(255,107,53,0.2)', borderRadius: 2, padding: 16, marginBottom: 24 }}>
                      <div style={{ fontSize: 8, color: '#ff6b35', letterSpacing: '0.15em', marginBottom: 10 }}>⚠ RISK ALERTS</div>
                      {signal.alerts.map((a, i) => (
                        <div key={i} style={{ fontSize: 10, color: THEME.muted, marginBottom: 4 }}>• {a}</div>
                      ))}
                    </div>
                  )}

                  {/* ── NEW: Risk Assessment ── */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.3em', color: THEME.muted, marginBottom: 12 }}>SECURITY ANALYSIS</div>
                    <RiskAssessment
                      initialAddress={analyzedMint}
                      chain="solana"
                      birdeyeApiKey={process.env.NEXT_PUBLIC_BIRDEYE_KEY || ''}
                      onScoreUpdate={undefined}
                    />
                  </div>

                  {/* ── NEW: Live Transactions ── */}
                  <div style={{ marginBottom: 24 }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.3em', color: THEME.muted, marginBottom: 12 }}>LIVE TRANSACTIONS</div>
                    <LiveTransactionsFeed
                      tokenPrice={0.001}
                      useMockData={true}
                    />
                  </div>

                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {tab === 'portfolio' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.3em', color: THEME.muted, marginBottom: 8 }}>PORTFOLIO TRACKER</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>AI <span style={{ color: THEME.gold }}>Portfolio Analysis</span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <input value={portfolioInput} onChange={e => setPortfolioInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addToPortfolio()}
                placeholder="Add mint address..."
                style={{ flex: 1, background: THEME.surface, border: '0.5px solid rgba(255,255,255,0.08)', color: THEME.text, fontFamily: 'monospace', fontSize: 11, padding: '10px 14px', outline: 'none', borderRadius: 1 }} />
              <button onClick={addToPortfolio}
                style={{ padding: '10px 20px', background: THEME.gold + '15', border: '0.5px solid ' + THEME.gold + '40', color: THEME.gold, fontFamily: 'monospace', fontSize: 10, cursor: 'pointer', borderRadius: 1 }}>
                ADD
              </button>
            </div>
            {portfolio.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 60, color: THEME.muted, fontSize: 10 }}>
                Add token addresses to track your portfolio
              </div>
            ) : (
              <div>
                {portfolio.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: THEME.surface, border: '0.5px solid rgba(255,255,255,0.04)', marginBottom: 4, borderRadius: 1 }}>
                    <span style={{ fontSize: 10, color: THEME.muted }}>{m.slice(0, 20)}...</span>
                    <button onClick={() => setPortfolio(portfolio.filter((_, j) => j !== i))}
                      style={{ background: 'none', border: 'none', color: '#ff2244', cursor: 'pointer', fontSize: 10 }}>✕</button>
                  </div>
                ))}
                <button
                  style={{ width: '100%', marginTop: 16, padding: '12px', background: THEME.gold + '12', border: '0.5px solid ' + THEME.gold + '30', color: THEME.gold, fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', cursor: 'pointer', borderRadius: 1 }}>
                  ANALYZE PORTFOLIO WITH AI →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── MARKET TAB ── */}
        {tab === 'market' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 9, letterSpacing: '0.3em', color: THEME.muted, marginBottom: 8 }}>MARKET OVERVIEW</div>
              <div style={{ fontSize: 22, fontWeight: 700 }}>Live <span style={{ color: THEME.gold }}>Market Dashboard</span></div>
            </div>
            <MarketDashboard
              onTokenSelect={(token: any) => {
                setMint(token.address);
                setTab('signal');
              }}
            />
          </div>
        )}

      </div>
    </div>
  );
}
