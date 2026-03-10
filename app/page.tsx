"use client";

import { useEffect, useState, useCallback, useRef } from "react";

// ─────── DexScreener Types ──────────────────────────────────────────────────────────────────────
interface DexPair {
  pairAddress: string;
  baseToken: { address: string; name: string; symbol: string };
  quoteToken: { symbol: string };
  priceUsd: string;
  priceChange: { h24: number; h6: number; h1: number; m5: number };
  volume: { h24: number };
  liquidity: { usd: number };
  fdv: number;
  txns: { h24: { buys: number; sells: number } };
  pairCreatedAt: number;
  url: string;
  chainId: string;
  dexId: string;
}
interface AlphaEntry extends DexPair {
  aiScore: number;
  risk: "SAFE" | "CAUTION" | "DANGER";
}

// ─────── Risk Engine ──────────────────────────────────────────────────────────────────────────
function computeRisk(p: DexPair): { aiScore: number; risk: AlphaEntry["risk"] } {
  let s = 100;
  const liq = p.liquidity?.usd ?? 0;
  if (liq < 10_000) s -= 40; else if (liq < 50_000) s -= 20; else if (liq < 200_000) s -= 10;
  const h1 = Math.abs(p.priceChange?.h1 ?? 0);
  const h24 = Math.abs(p.priceChange?.h24 ?? 0);
  if (h1 > 50) s -= 20; else if (h1 > 20) s -= 10;
  if (h24 > 80) s -= 15;
  const ratio = liq > 0 ? (p.volume?.h24 ?? 0) / liq : 0;
  if (ratio > 20) s -= 20; else if (ratio > 10) s -= 10;
  const age = Date.now() - (p.pairCreatedAt ?? 0);
  if (age < 3_600_000) s -= 15; else if (age < 86_400_000) s -= 5;
  const aiScore = Math.max(5, Math.min(99, s));
  const risk: AlphaEntry["risk"] = aiScore >= 70 ? "SAFE" : aiScore >= 40 ? "CAUTION" : "DANGER";
  return { aiScore, risk };
}

// ─────── Simple Alpha Feed Component ──────────────────────────────────────────────────
function SimpleAlphaFeed() {
  const [entries, setEntries] = useState<AlphaEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo
    setTimeout(() => {
      const mockEntries: AlphaEntry[] = [
        {
          pairAddress: "ABC123",
          baseToken: { address: "ABC", name: "Sample Token", symbol: "SAMPLE" },
          quoteToken: { symbol: "SOL" },
          priceUsd: "0.1234",
          priceChange: { h24: 15.2, h6: 8.1, h1: 2.3, m5: 0.5 },
          volume: { h24: 50000 },
          liquidity: { usd: 125000 },
          fdv: 1000000,
          txns: { h24: { buys: 120, sells: 80 } },
          pairCreatedAt: Date.now() - 86400000,
          url: "",
          chainId: "solana",
          dexId: "raydium",
          aiScore: 85,
          risk: "SAFE"
        }
      ];
      setEntries(mockEntries);
      setLoading(false);
    }, 1000);
  }, []);

  return (
    <div style={{ background: "#111128", border: "1px solid rgba(124,58,237,0.18)", borderRadius: 16, padding: 20 }}>
      <h3 style={{ color: "#e2e8f0", marginBottom: 16 }}>Alpha Feed</h3>
      {loading ? (
        <p style={{ color: "#94a3b8" }}>Loading live pairs...</p>
      ) : (
        <div>
          {entries.map(entry => (
            <div key={entry.pairAddress} style={{ padding: 10, borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
              <strong style={{ color: "#e2e8f0" }}>{entry.baseToken.symbol}</strong>
              <span style={{ color: entry.risk === "SAFE" ? "#4ade80" : "#fbbf24", marginLeft: 10 }}>
                AI Score: {entry.aiScore} ({entry.risk})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────── Page ──────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div style={{ background: "#06060f", color: "#e2e8f0", minHeight: "100vh", padding: 20 }}>
      <header style={{ textAlign: "center", padding: "60px 0" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 800, marginBottom: 20 }}>
          CryptoCheck <span style={{ color: "#a78bfa" }}>AI</span>
        </h1>
        <p style={{ fontSize: "1.2rem", color: "#94a3b8", maxWidth: 600, margin: "0 auto" }}>
          The AI-Powered Token Scanner for Solana. Instantly analyze any token with deep neural intelligence.
        </p>
      </header>
      
      <main style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SimpleAlphaFeed />
      </main>
    </div>
  );
}
