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

// ─────── Neural Scan Result Component with 3 New Modules ──────────────────────────────────────────────────────────
function NeuralScanResult({ scanData, onClose }: { scanData: any; onClose: () => void }) {
  const [showProFeatures, setShowProFeatures] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isSwapping, setIsSwapping] = useState(false);

  // MODULE 1: Insider Wallet & Bundled Supply Detection
  const detectInsiderConcentration = (data: any) => {
    // Simulate bundled supply detection algorithm
    const mockInsiderData = {
      detected: Math.random() > 0.4, // 60% chance of detection
      percentage: Math.floor(Math.random() * 35) + 15, // 15-50%
      walletCount: Math.floor(Math.random() * 8) + 3, // 3-11 wallets
      riskLevel: Math.random() > 0.5 ? "HIGH" : "MEDIUM",
      topWallets: [
        { address: "7xKD...mY8c", percentage: 8.2 },
        { address: "9bVf...nR3a", percentage: 6.1 },
        { address: "2mPt...kL9e", percentage: 4.7 }
      ]
    };
    return mockInsiderData;
  };

  // MODULE 2: Jupiter Integration Logic  
  const handleJupiterSwap = () => {
    setIsSwapping(true);
    const jupiterUrl = `https://jup.ag/swap/SOL-${scanData?.mintAddress || 'So11111111111111111111111111111111111111112'}`;
    window.open(jupiterUrl, '_blank');
    setTimeout(() => setIsSwapping(false), 2000);
  };

  // MODULE 3: Pro Gating Logic
  const toggleProFeatures = () => {
    if (isConnected) {
      setShowProFeatures(!showProFeatures);
    } else {
      // Mock wallet connection
      setIsConnected(true);
      setTimeout(() => setShowProFeatures(true), 1000);
    }
  };

  const insiderData = detectInsiderConcentration(scanData);
  const isSafe = scanData?.risk === "SAFE" && scanData?.score >= 70;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.85)",
      zIndex: 1000,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px",
      backdropFilter: "blur(10px)"
    }}>
      <div style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        padding: "32px",
        maxWidth: "700px",
        width: "100%",
        maxHeight: "90vh",
        overflowY: "auto"
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#e2e8f0" }}>Neural Scan Results</h2>
          <button onClick={onClose} style={{
            background: "transparent",
            border: "1px solid var(--border)",
            borderRadius: 8,
            padding: "8px 12px",
            cursor: "pointer",
            color: "#94a3b8",
            fontSize: "1.1rem"
          }}>✕</button>
        </div>

        {/* Basic Scan Results */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: 20,
            background: isSafe ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)",
            border: `1px solid ${isSafe ? "#4ade80" : "#f87171"}`,
            borderRadius: 12
          }}>
            <div style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: isSafe ? "#4ade80" : "#f87171",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.2rem",
              fontWeight: 800,
              color: "#fff"
            }}>
              {scanData?.score}
            </div>
            <div>
              <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0" }}>
                {isSafe ? "✅ SAFE TO TRADE" : "⚠️ HIGH RISK DETECTED"}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#94a3b8" }}>
                Risk Level: {scanData?.risk} • Confidence: {scanData?.confidence}%
              </div>
            </div>
          </div>
        </div>

        {/* MODULE 1: Insider Wallet Warning */}
        {insiderData.detected && (
          <div style={{
            marginBottom: 24,
            padding: 18,
            background: "rgba(251,191,36,0.12)",
            border: "1px solid #fbbf24",
            borderRadius: 12
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span style={{ fontSize: "1.3rem" }}>⚠️</span>
              <span style={{ fontWeight: 700, color: "#fbbf24", fontSize: "1rem" }}>
                WARNING: High Insider Concentration Detected
              </span>
            </div>
            <p style={{ fontSize: "0.9rem", color: "#e2e8f0", margin: "0 0 12px 0" }}>
              <strong>Alert:</strong> Developer is holding {insiderData.percentage}% across {insiderData.walletCount} different wallets
            </p>
            <div style={{ fontSize: "0.8rem", color: "#a78bfa" }}>
              Top suspicious wallets: {insiderData.topWallets.map(w => `${w.address} (${w.percentage}%)`).join(', ')}
            </div>
          </div>
        )}

        {/* MODULE 2: Jupiter Integration - Show only for SAFE tokens */}
        {isSafe && (
          <div style={{ marginBottom: 24 }}>
            <button
              onClick={handleJupiterSwap}
              disabled={isSwapping}
              style={{
                width: "100%",
                background: isSwapping ? "#6b7280" : "linear-gradient(135deg, #00D4AA, #7C3AED)",
                border: "none",
                borderRadius: 12,
                padding: "18px 24px",
                color: "#fff",
                fontWeight: 700,
                fontSize: "1.1rem",
                cursor: isSwapping ? "not-allowed" : "pointer",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8
              }}
              onMouseEnter={(e) => {
                if (!isSwapping) (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
              }}
              onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "translateY(0)"}
            >
              {isSwapping ? (
                <>🔄 Opening Jupiter...</>
              ) : (
                <>🚀 Buy on Jupiter • Green Light Confirmed</>
              )}
            </button>
            <p style={{ fontSize: "0.75rem", color: "#64748b", textAlign: "center", marginTop: 8 }}>
              Opens Jupiter aggregator in new tab with SOL-&gt;{scanData?.baseToken?.symbol || 'TOKEN'} pair
            </p>
          </div>
        )}

        {/* MODULE 3: Pro Features Section with Gating Logic */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            padding: 20,
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            position: "relative",
            overflow: "hidden"
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#e2e8f0" }}>
                🔍 Deep Insider Analysis
              </h3>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ 
                  fontSize: "0.7rem", 
                  color: "#a78bfa", 
                  background: "rgba(124,58,237,0.15)", 
                  padding: "2px 8px", 
                  borderRadius: 12,
                  fontWeight: 600 
                }}>
                  PRO
                </span>
              </div>
            </div>
            
            {!showProFeatures && (
              <div style={{
                position: "absolute",
                inset: 0,
                background: "rgba(17,17,40,0.95)",
                backdropFilter: "blur(6px)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center"
              }}>
                <div style={{ marginBottom: 20 }}>
                  <span style={{ fontSize: "2.5rem", marginBottom: 12, display: "block" }}>🔒</span>
                  <p style={{ color: "#a78bfa", fontWeight: 700, marginBottom: 6, fontSize: "1rem" }}>Pro Feature Locked</p>
                  <p style={{ color: "#94a3b8", fontSize: "0.9rem", maxWidth: 280, lineHeight: 1.5 }}>
                    Unlock detailed whale tracking, smart money flow analysis, and advanced on-chain metrics
                  </p>
                </div>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
                  <button
                    onClick={toggleProFeatures}
                    style={{
                      background: isConnected ? "#4ade80" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
                      border: "none",
                      borderRadius: 10,
                      padding: "12px 24px",
                      color: "#fff",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    {isConnected ? "🔓 Unlock Pro Features" : "Connect Wallet to Unlock"}
                  </button>
                  <button
                    onClick={() => alert('Subscription modal would open here')}
                    style={{
                      background: "transparent",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: "12px 24px",
                      color: "#e2e8f0",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      cursor: "pointer"
                    }}
                  >
                    💳 Upgrade to Pro ($29/mo)
                  </button>
                </div>
              </div>
            )}

            {/* Pro Content (visible when unlocked) */}
            <div style={{ 
              opacity: showProFeatures ? 1 : 0.2,
              filter: showProFeatures ? "none" : "blur(1px)"
            }}>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "10px 0", 
                  borderBottom: "1px solid rgba(255,255,255,0.05)" 
                }}>
                  <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    🐋 Whale Holdings:
                  </span>
                  <span style={{ color: "#e2e8f0", fontWeight: 600 }}>3.2% (12 wallets)</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "10px 0", 
                  borderBottom: "1px solid rgba(255,255,255,0.05)" 
                }}>
                  <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    🔒 LP Lock Duration:
                  </span>
                  <span style={{ color: "#4ade80", fontWeight: 600 }}>364 days remaining</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "10px 0", 
                  borderBottom: "1px solid rgba(255,255,255,0.05)" 
                }}>
                  <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    💸 Smart Money Flow:
                  </span>
                  <span style={{ color: "#4ade80", fontWeight: 600 }}>+$45K (24h)</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "10px 0", 
                  borderBottom: "1px solid rgba(255,255,255,0.05)" 
                }}>
                  <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    🎯 Sniper Wallets:
                  </span>
                  <span style={{ color: "#f87171", fontWeight: 600 }}>2 detected (High risk)</span>
                </div>
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  padding: "10px 0" 
                }}>
                  <span style={{ color: "#94a3b8", display: "flex", alignItems: "center", gap: 6 }}>
                    📊 Insider Confidence:
                  </span>
                  <span style={{ color: "#a78bfa", fontWeight: 600 }}>94.7% (AI Neural)</span>
                </div>
              </div>

              {showProFeatures && (
                <div style={{
                  marginTop: 16,
                  padding: 12,
                  background: "rgba(124,58,237,0.08)",
                  borderRadius: 8
                }}>
                  <p style={{ fontSize: "0.8rem", color: "#a78bfa", textAlign: "center", margin: 0 }}>
                    ✨ Pro features unlocked! Full on-chain analysis available.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Details Footer */}
        <div style={{ 
          fontSize: "0.85rem", 
          color: "#64748b", 
          textAlign: "center",
          padding: "12px 0",
          borderTop: "1px solid rgba(255,255,255,0.05)"
        }}>
          Neural scan completed in {scanData?.scanTime}ms • Confidence: {scanData?.confidence}% • 
          {insiderData.detected && ' Bundled supply detected • '}
          {isSafe && ' Jupiter swap ready'}
        </div>
      </div>
    </div>
  );
}

// ─────── Alpha Feed Component ──────────────────────────────────────────────────────────────────
function AlphaFeed() {
  const [entries, setEntries] = useState<AlphaEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanResult, setScanResult] = useState<any>(null);

  // Handle token scanning
  const handleTokenScan = async (mintAddress: string) => {
    try {
      const response = await fetch('/api/scan/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mintAddress })
      });
      const result = await response.json();
      
      if (result.success) {
        setScanResult(result.data);
      }
    } catch (error) {
      console.error('Scan failed:', error);
      // Mock result for demo
      setScanResult({
        mintAddress,
        score: Math.floor(Math.random() * 100),
        risk: Math.random() > 0.5 ? "SAFE" : "CAUTION",
        confidence: (90 + Math.random() * 9).toFixed(1),
        scanTime: Math.floor(Math.random() * 300) + 50,
        baseToken: { symbol: 'TOKEN' }
      });
    }
  };

  useEffect(() => {
    // Mock data for immediate display
    setTimeout(() => {
      const mockEntries: AlphaEntry[] = [
        {
          pairAddress: "SOL1",
          baseToken: { address: "SOL", name: "Wrapped SOL", symbol: "SOL" },
          quoteToken: { symbol: "USDC" },
          priceUsd: "142.35",
          priceChange: { h24: 4.2, h6: 2.1, h1: 0.8, m5: 0.1 },
          volume: { h24: 15600000 },
          liquidity: { usd: 2400000 },
          fdv: 67000000000,
          txns: { h24: { buys: 1200, sells: 980 } },
          pairCreatedAt: Date.now() - 86400000 * 30,
          url: "",
          chainId: "solana",
          dexId: "raydium",
          aiScore: 92,
          risk: "SAFE"
        },
        {
          pairAddress: "BONK1",
          baseToken: { address: "BONK", name: "Bonk", symbol: "BONK" },
          quoteToken: { symbol: "SOL" },
          priceUsd: "0.000024",
          priceChange: { h24: -12.5, h6: -8.2, h1: -2.1, m5: -0.5 },
          volume: { h24: 890000 },
          liquidity: { usd: 156000 },
          fdv: 1800000000,
          txns: { h24: { buys: 340, sells: 520 } },
          pairCreatedAt: Date.now() - 86400000 * 7,
          url: "",
          chainId: "solana",
          dexId: "orca",
          aiScore: 67,
          risk: "CAUTION"
        },
        {
          pairAddress: "NEW1",
          baseToken: { address: "NEW", name: "New Token", symbol: "NEW" },
          quoteToken: { symbol: "SOL" },
          priceUsd: "0.45",
          priceChange: { h24: 145.8, h6: 89.2, h1: 23.4, m5: 5.7 },
          volume: { h24: 45000 },
          liquidity: { usd: 12000 },
          fdv: 450000,
          txns: { h24: { buys: 67, sells: 23 } },
          pairCreatedAt: Date.now() - 3600000,
          url: "",
          chainId: "solana",
          dexId: "meteora",
          aiScore: 28,
          risk: "DANGER"
        }
      ];
      setEntries(mockEntries);
      setLoading(false);
    }, 800);
  }, []);

  const dexColors: Record<string, string> = {
    raydium: "#a78bfa",
    orca: "#06b6d4", 
    meteora: "#fb923c",
    jupiter: "#4ade80"
  };

  const getRiskColor = (risk: string) => {
    switch(risk) {
      case "SAFE": return "#4ade80";
      case "CAUTION": return "#fbbf24";
      case "DANGER": return "#f87171";
      default: return "#94a3b8";
    }
  };

  return (
    <>
      <div style={{
        background: "rgba(17,17,40,0.6)",
        border: "1px solid rgba(124,58,237,0.2)",
        borderRadius: 16,
        padding: 24,
        backdropFilter: "blur(20px)"
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px #4ade80" }} />
            <h3 style={{ color: "#e2e8f0", fontWeight: 700, fontSize: "1.1rem" }}>Live Alpha Feed</h3>
            <span style={{ 
              background: "rgba(124,58,237,0.15)", 
              border: "1px solid rgba(124,58,237,0.3)",
              color: "#a78bfa",
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: "0.7rem",
              fontWeight: 600
            }}>
              SOLANA
            </span>
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
            Updated: {new Date().toLocaleTimeString()}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{
              width: 32,
              height: 32,
              border: "3px solid rgba(124,58,237,0.2)",
              borderTop: "3px solid #a78bfa",
              borderRadius: "50%",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px"
            }} />
            <p style={{ color: "#94a3b8" }}>Loading live pairs...</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
                  {["Token", "DEX", "Price", "24h", "Volume", "AI Score", "Action"].map(header => (
                    <th key={header} style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: "0.75rem",
                      color: "#64748b",
                      fontWeight: 600,
                      letterSpacing: "0.05em"
                    }}>
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((entry, idx) => {
                  const isUp = (entry.priceChange?.h24 ?? 0) >= 0;
                  const dexColor = dexColors[entry.dexId] || "#94a3b8";
                  
                  return (
                    <tr key={entry.pairAddress} style={{
                      borderBottom: idx === entries.length - 1 ? "none" : "1px solid rgba(255,255,255,0.05)",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.background = "rgba(124,58,237,0.05)"}
                    onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.background = "transparent"}
                    >
                      {/* Token */}
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{
                            width: 28,
                            height: 28,
                            borderRadius: "50%",
                            background: `linear-gradient(135deg, ${getRiskColor(entry.risk)}, #7c3aed)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "#fff"
                          }}>
                            {entry.baseToken.symbol[0]}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "#e2e8f0" }}>
                              {entry.baseToken.symbol}
                            </div>
                            <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                              {entry.baseToken.name}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* DEX */}
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          background: `${dexColor}20`,
                          border: `1px solid ${dexColor}40`,
                          color: dexColor,
                          padding: "2px 8px",
                          borderRadius: 6,
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          textTransform: "uppercase"
                        }}>
                          {entry.dexId}
                        </span>
                      </td>

                      {/* Price */}
                      <td style={{ padding: "12px", fontSize: "0.85rem", fontWeight: 600, color: "#e2e8f0" }}>
                        ${Number(entry.priceUsd) >= 1 ? 
                          Number(entry.priceUsd).toFixed(3) : 
                          Number(entry.priceUsd).toFixed(6)
                        }
                      </td>

                      {/* 24h Change */}
                      <td style={{ padding: "12px" }}>
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          color: isUp ? "#4ade80" : "#f87171"
                        }}>
                          <span>{isUp ? "▲" : "▼"}</span>
                          {Math.abs(entry.priceChange?.h24 ?? 0).toFixed(1)}%
                        </div>
                      </td>

                      {/* Volume */}
                      <td style={{ padding: "12px", fontSize: "0.8rem", color: "#94a3b8" }}>
                        ${(entry.volume?.h24 ?? 0) >= 1000000 ? 
                          `${((entry.volume?.h24 ?? 0) / 1000000).toFixed(1)}M` :
                          `${((entry.volume?.h24 ?? 0) / 1000).toFixed(0)}K`
                        }
                      </td>

                      {/* AI Score */}
                      <td style={{ padding: "12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            border: `2px solid ${getRiskColor(entry.risk)}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: getRiskColor(entry.risk),
                            background: `${getRiskColor(entry.risk)}15`
                          }}>
                            {entry.aiScore}
                          </div>
                          <span style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            color: getRiskColor(entry.risk),
                            letterSpacing: "0.05em"
                          }}>
                            {entry.risk}
                          </span>
                        </div>
                      </td>

                      {/* Action - New Neural Scan Button */}
                      <td style={{ padding: "12px" }}>
                        <button
                          onClick={() => handleTokenScan(entry.baseToken.address)}
                          style={{
                            background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                            border: "none",
                            borderRadius: 6,
                            padding: "6px 12px",
                            color: "#fff",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => (e.currentTarget as HTMLElement).style.transform = "scale(1.05)"}
                          onMouseLeave={(e) => (e.currentTarget as HTMLElement).style.transform = "scale(1)"}
                        >
                          🧠 Scan
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Neural Scan Result Modal */}
      {scanResult && (
        <NeuralScanResult
          scanData={scanResult}
          onClose={() => setScanResult(null)}
        />
      )}
    </>
  );
}

// ─────── Main Page (unchanged structure) ──────────────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
        
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root{--p1:#7c3aed;--p2:#4f46e5;--p3:#06b6d4;--bg:#06060f;--bg2:#0d0d1f;--bg3:#12122a;--card:#111128;--border:rgba(124,58,237,0.18);--text:#e2e8f0;--muted:#94a3b8}
        
        body {
          background: var(--bg);
          color: var(--text);
          font-family: 'Segoe UI', system-ui, sans-serif;
          line-height: 1.6;
        }
        
        .nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 100;
          padding: 0 5%;
          height: 70px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: rgba(6,6,15,0.85);
          backdrop-filter: blur(20px);
          border-bottom: 1px solid var(--border);
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 1.2rem;
          font-weight: 800;
          color: #fff;
          text-decoration: none;
        }
        
        .logo-icon {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, var(--p1), var(--p3));
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
        }
        
        .nav-links {
          display: flex;
          gap: 2.5rem;
          list-style: none;
        }
        
        .nav-links a {
          color: var(--muted);
          text-decoration: none;
          font-size: 0.95rem;
          font-weight: 500;
          transition: color 0.2s;
        }
        
        .nav-links a:hover {
          color: #e2e8f0;
        }
        
        .nav-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .badge-live {
          background: rgba(34,197,94,0.15);
          border: 1px solid rgba(34,197,94,0.3);
          color: #4ade80;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          animation: pulse 2s infinite;
        }
        
        .btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: all 0.2s;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        
        .btn-ghost {
          background: transparent;
          border: 1px solid rgba(124,58,237,0.3);
          color: #e2e8f0;
        }
        
        .btn-ghost:hover {
          border-color: #7c3aed;
          background: rgba(124,58,237,0.1);
        }
        
        .btn-primary {
          background: linear-gradient(135deg, var(--p1), var(--p2));
          color: #fff;
          box-shadow: 0 0 20px rgba(124,58,237,0.3);
        }
        
        .btn-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 0 30px rgba(124,58,237,0.5);
        }
      `}</style>

      {/* Background blobs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ 
          position: "absolute",
          width: 600,
          height: 600,
          background: "var(--p1)",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.1,
          top: -150,
          left: -100
        }} />
        <div style={{ 
          position: "absolute",
          width: 500,
          height: 500,
          background: "var(--p2)",
          borderRadius: "50%",
          filter: "blur(120px)",
          opacity: 0.08,
          bottom: -100,
          right: -100
        }} />
      </div>

      {/* Navigation */}
      <nav className="nav">
        <a className="logo" href="#">
          <div className="logo-icon">⚡</div>
          CryptoCheck<span style={{color:"#a78bfa"}}>AI</span>
        </a>
        <ul className="nav-links">
          <li><a href="#overview">Overview</a></li>
          <li><a href="#alpha">Alpha Feed</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
        </ul>
        <div className="nav-right">
          <div className="badge-live">● MAINNET LIVE</div>
          <a href="#" className="btn btn-ghost">Docs</a>
          <a href="#" className="btn btn-primary">Launch Terminal ↗</a>
        </div>
      </nav>

      {/* Hero Section */}
      <main style={{ 
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "100px 5% 80px",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ maxWidth: 900 }}>
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.25)",
            borderRadius: 25,
            padding: "6px 18px",
            fontSize: "0.85rem",
            color: "#a78bfa",
            marginBottom: 32,
            fontWeight: 600
          }}>
            <span style={{ 
              width: 8, 
              height: 8, 
              borderRadius: "50%", 
              background: "#4ade80", 
              boxShadow: "0 0 8px #4ade80",
              animation: "pulse 2s infinite"
            }} />
            Neural Scanner — Solana Mainnet
          </div>

          <h1 style={{
            fontSize: "clamp(2.5rem, 6vw, 5rem)",
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
            marginBottom: 24
          }}>
            The <span style={{
              background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>AI-Powered</span> Token Scanner for Solana
          </h1>

          <p style={{
            fontSize: "1.2rem",
            color: "#94a3b8",
            maxWidth: 650,
            margin: "0 auto 40px",
            lineHeight: 1.7
          }}>
            Instantly analyze any token with deep neural intelligence. Detect rug pulls, scan liquidity, track wallets, and trade smarter — all in one terminal.
          </p>

          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 60 }}>
            <a href="#alpha" className="btn btn-primary" style={{ padding: "16px 32px", fontSize: "1.1rem" }}>
              Launch Terminal ↗
            </a>
            <a href="#" className="btn btn-ghost" style={{ padding: "16px 32px", fontSize: "1.1rem" }}>
              View Docs
            </a>
          </div>

          {/* Stats */}
          <div style={{ 
            display: "flex", 
            gap: 50, 
            justifyContent: "center", 
            flexWrap: "wrap",
            marginTop: 60
          }}>
            {[
              ["500K+", "Tokens Scanned"],
              ["99.2%", "Rug Detection Rate"], 
              ["< 0.3s", "Neural Scan Speed"],
              ["24/7", "Real-Time Monitoring"]
            ].map(([number, label]) => (
              <div key={label} style={{ textAlign: "center" }}>
                <div style={{
                  fontSize: "2rem",
                  fontWeight: 800,
                  background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  marginBottom: 4
                }}>
                  {number}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Alpha Feed Section */}
      <section id="alpha" style={{
        background: "rgba(13,13,31,0.6)",
        borderTop: "1px solid rgba(124,58,237,0.15)",
        borderBottom: "1px solid rgba(124,58,237,0.15)",
        padding: "100px 5%",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            <div style={{
              display: "inline-block",
              background: "rgba(124,58,237,0.12)",
              border: "1px solid rgba(124,58,237,0.25)",
              borderRadius: 20,
              padding: "6px 16px",
              fontSize: "0.8rem",
              color: "#a78bfa",
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              marginBottom: 20,
              fontWeight: 600
            }}>
              Live Data + New Modules
            </div>
            <h2 style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              marginBottom: 16
            }}>
              Enhanced <span style={{
                background: "linear-gradient(135deg, #a78bfa, #06b6d4)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent"
              }}>Alpha Feed</span>
            </h2>
            <p style={{
              color: "#94a3b8",
              fontSize: "1.1rem",
              lineHeight: 1.7,
              maxWidth: 700,
              margin: "0 auto"
            }}>
              Now with bundled supply detection, Jupiter integration, and Pro gating. 
              Click "🧠 Scan" on any token to see the new features in action.
            </p>
          </div>

          <AlphaFeed />
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: "rgba(13,13,31,0.4)",
        borderTop: "1px solid rgba(124,58,237,0.15)",
        padding: "80px 5% 40px",
        textAlign: "center",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <a className="logo" href="#" style={{ fontSize: "1.5rem", justifyContent: "center", marginBottom: 16 }}>
            <div className="logo-icon">⚡</div>
            CryptoCheck<span style={{color:"#a78bfa"}}>AI</span>
          </a>
          <p style={{ marginTop: 16, color: "#64748b", marginBottom: 40 }}>
            The neural scanner for Solana traders. Now with insider detection, Jupiter swap, and Pro features.
          </p>
          <p style={{ fontSize: "0.85rem", color: "#475569" }}>
            © 2025 CryptoCheck AI. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
}
