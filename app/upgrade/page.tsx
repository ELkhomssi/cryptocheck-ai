'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

const THEME = {
  bg: '#030303', surface: '#080808',
  border: 'rgba(255,255,255,0.04)',
  gold: '#ffb300', emerald: '#00ff88',
  text: 'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.25)',
  dim: 'rgba(255,255,255,0.08)',
};

const PLANS = [
  {
    id: 'free',
    name: 'FREE',
    price: '$0',
    period: 'forever',
    color: 'rgba(255,255,255,0.3)',
    features: [
      '5 scans per day',
      'Basic risk analysis',
      'Terminal view',
      'Community support',
    ],
    disabled: ['AI Trading Robot', 'Real-time alerts', 'Auto trade execution', 'Portfolio tracker', 'Unlimited scans'],
  },
  {
    id: 'weekly',
    name: 'PRO',
    price: '$5',
    period: 'per week',
    color: '#ffb300',
    badge: 'POPULAR',
    features: [
      'Unlimited scans',
      'AI Trading Robot',
      'Real-time risk alerts',
      'Auto Buy/Sell signals',
      'Portfolio tracker',
      'Auto trade execution',
      'Priority support',
    ],
    disabled: [],
  },
  {
    id: 'yearly',
    name: 'PRO ANNUAL',
    price: '$200',
    period: 'per year',
    color: '#00ff88',
    badge: 'SAVE 23%',
    features: [
      'Everything in PRO',
      'Unlimited scans',
      'AI Trading Robot',
      'Real-time risk alerts',
      'Auto Buy/Sell signals',
      'Portfolio tracker',
      'Auto trade execution',
      'VIP support',
    ],
    disabled: [],
  },
];

export default function UpgradePage() {
  const [loading, setLoading] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState<'card' | 'crypto'>('card');

  const handleUpgrade = async (planId: string) => {
    if (planId === 'free') return;
    setLoading(planId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: planId, method: payMethod }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100dvh', background: THEME.bg, color: THEME.text, fontFamily: 'monospace' }}>
      {/* Header */}
      <header style={{ height: 44, background: THEME.surface, borderBottom: '0.5px solid ' + THEME.border, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px' }}>
        <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
          <div style={{ width: 16, height: 16, border: '0.5px solid ' + THEME.gold + '60', background: THEME.gold + '08', transform: 'rotate(45deg)' }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: THEME.gold }}>CRYPTOCHECK</span>
          <span style={{ fontSize: 9, color: THEME.muted, letterSpacing: '0.2em' }}>ALPHA TERMINAL</span>
        </a>
        <a href="/" style={{ fontSize: 9, color: THEME.muted, textDecoration: 'none', letterSpacing: '0.15em' }}>← BACK TO TERMINAL</a>
      </header>

      <div style={{ maxWidth: 960, margin: '0 auto', padding: '60px 24px' }}>
        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div style={{ fontSize: 9, letterSpacing: '0.3em', color: THEME.muted, marginBottom: 12 }}>UPGRADE YOUR PLAN</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: THEME.text, marginBottom: 8 }}>
              Unlock <span style={{ color: THEME.gold }}>AI Trading</span> Power
            </div>
            <div style={{ fontSize: 11, color: THEME.muted }}>Scan unlimited tokens · AI signals · Auto trade execution</div>
          </motion.div>
        </div>

        {/* Payment method toggle */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 40 }}>
          {(['card', 'crypto'] as const).map(m => (
            <button key={m} onClick={() => setPayMethod(m)}
              style={{ padding: '6px 20px', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', border: '0.5px solid', borderColor: payMethod === m ? THEME.gold + '50' : 'rgba(255,255,255,0.08)', color: payMethod === m ? THEME.gold : THEME.muted, background: payMethod === m ? THEME.gold + '10' : 'transparent', borderRadius: 1, cursor: 'pointer' }}>
              {m === 'card' ? '💳 Card' : '◎ Crypto (SOL/USDC)'}
            </button>
          ))}
        </div>

        {/* Plans */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {PLANS.map((plan, i) => (
            <motion.div key={plan.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              style={{ background: THEME.surface, border: '0.5px solid ' + (plan.color === THEME.gold || plan.color === THEME.emerald ? plan.color + '30' : THEME.border), borderRadius: 2, padding: 24, position: 'relative', display: 'flex', flexDirection: 'column' }}>

              {plan.badge && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: plan.color, color: '#000', fontSize: 8, fontWeight: 700, padding: '2px 10px', letterSpacing: '0.15em', borderRadius: 1 }}>
                  {plan.badge}
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', color: plan.color, marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: THEME.text }}>{plan.price}</span>
                  <span style={{ fontSize: 10, color: THEME.muted }}>{plan.period}</span>
                </div>
              </div>

              <div style={{ flex: 1, marginBottom: 24 }}>
                {plan.features.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>
                    <span style={{ color: plan.color }}>✓</span> {f}
                  </div>
                ))}
                {plan.disabled.map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 10, color: THEME.dim }}>
                    <span>✕</span> {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleUpgrade(plan.id)}
                disabled={plan.id === 'free' || loading === plan.id}
                style={{ width: '100%', padding: '10px', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.15em', textTransform: 'uppercase', border: '0.5px solid ' + (plan.id === 'free' ? THEME.border : plan.color + '50'), color: plan.id === 'free' ? THEME.dim : plan.color, background: plan.id === 'free' ? 'transparent' : plan.color + '12', borderRadius: 1, cursor: plan.id === 'free' ? 'default' : 'pointer' }}>
                {loading === plan.id ? 'LOADING...' : plan.id === 'free' ? 'CURRENT PLAN' : `UPGRADE → ${plan.name}`}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Features grid */}
        <div style={{ marginTop: 60, borderTop: '0.5px solid ' + THEME.border, paddingTop: 48 }}>
          <div style={{ textAlign: 'center', fontSize: 9, letterSpacing: '0.25em', color: THEME.muted, marginBottom: 32 }}>AI TRADING ROBOT FEATURES</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { icon: '🤖', title: 'AI Signals', desc: 'GPT-4 analyzes patterns and generates buy/sell signals in real-time' },
              { icon: '⚡', title: 'Auto Execute', desc: 'Automatically executes trades via Jupiter when signals trigger' },
              { icon: '🛡️', title: 'Risk Alerts', desc: 'Instant alerts when rug pull patterns detected in your portfolio' },
              { icon: '📊', title: 'Portfolio AI', desc: 'Track all positions with AI-powered P&L analysis and suggestions' },
            ].map((f, i) => (
              <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + i * 0.1 }}
                style={{ background: THEME.surface, border: '0.5px solid ' + THEME.border, borderRadius: 2, padding: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: THEME.gold, marginBottom: 6, letterSpacing: '0.1em' }}>{f.title}</div>
                <div style={{ fontSize: 10, color: THEME.muted, lineHeight: 1.6 }}>{f.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
