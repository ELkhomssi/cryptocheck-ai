import { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// CACHING LAYER — avoids Vercel rate limits
// In-memory cache with TTL (5 minutes per token)
// ============================================================
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

// ============================================================
// API LAYER
// Chains supported: solana | ethereum | bsc | arbitrum
// ============================================================

// 1. GoPlus Security API — HoneyPot, Mint Auth, Freeze, etc.
async function fetchGoPlusSecurity(address, chain = "solana") {
  const chainMap = { solana: "solana", ethereum: "1", bsc: "56", arbitrum: "42161" };
  const chainId = chainMap[chain] || "solana";
  const cacheKey = `goplus_${chainId}_${address}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const isSolana = chain === "solana";
    const url = isSolana
      ? `https://api.gopluslabs.io/api/v1/solana/token_security?contract_addresses=${address}`
      : `https://api.gopluslabs.io/api/v1/token_security/${chainId}?contract_addresses=${address}`;

    const res = await fetch(url);
    const json = await res.json();
    const data = json?.result?.[address.toLowerCase()] || json?.result?.[address] || null;
    setCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

// 2. Honeypot.is API — EVM only
async function fetchHoneypotStatus(address, chainId = "1") {
  const cacheKey = `honeypot_${chainId}_${address}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.honeypot.is/v2/IsHoneypot?address=${address}&chainID=${chainId}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

// 3. DexScreener API — Liquidity + holders
async function fetchDexScreener(address) {
  const cacheKey = `dexscreener_${address}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

// 4. Birdeye API — Solana top holders (requires API key)
async function fetchBirdeyeHolders(address, apiKey) {
  if (!apiKey) return null;
  const cacheKey = `birdeye_holders_${address}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`https://public-api.birdeye.so/defi/token_holder?address=${address}&limit=10`, {
      headers: { "X-API-KEY": apiKey },
    });
    const data = await res.json();
    setCache(cacheKey, data);
    return data;
  } catch {
    return null;
  }
}

// ============================================================
// SCORE ENGINE — computes 0-100 trust score
// ============================================================
function computeTrustScore(flags) {
  let score = 100;
  const deductions = {
    isHoneypot: 60,
    mintAuthorityActive: 20,
    freezeAuthorityActive: 15,
    liquidityNotLocked: 20,
    top10Over80pct: 25,
    top10Over50pct: 10,
    blacklistFunction: 15,
    pausable: 10,
    proxyContract: 5,
  };

  for (const [flag, deduction] of Object.entries(deductions)) {
    if (flags[flag]) score -= deduction;
  }

  return Math.max(0, Math.min(100, score));
}

function getScoreColor(score) {
  if (score >= 80) return "#00ff88";
  if (score >= 60) return "#ffcc00";
  if (score >= 40) return "#ff8800";
  return "#ff3355";
}

function getScoreLabel(score) {
  if (score >= 80) return "SAFE";
  if (score >= 60) return "CAUTION";
  if (score >= 40) return "RISKY";
  return "DANGER";
}

// ============================================================
// TRUST SCORE GAUGE — SVG arc gauge
// ============================================================
function TrustGauge({ score, loading }) {
  const color = getScoreColor(score);
  const label = getScoreLabel(score);
  const radius = 80;
  const stroke = 12;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * Math.PI; // half circle
  const progress = loading ? 0 : (score / 100) * circumference;

  // SVG arc from left to right (bottom half hidden)
  const cx = 100, cy = 100;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Background track */}
        <path
          d={`M ${cx - normalizedRadius} ${cy} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${cx + normalizedRadius} ${cy}`}
          fill="none"
          stroke="#1a1f2e"
          strokeWidth={stroke}
          strokeLinecap="round"
        />
        {/* Colored progress */}
        <path
          d={`M ${cx - normalizedRadius} ${cy} A ${normalizedRadius} ${normalizedRadius} 0 0 1 ${cx + normalizedRadius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={circumference - progress}
          style={{ transition: "stroke-dashoffset 1s ease, stroke 0.5s ease" }}
          filter={`drop-shadow(0 0 8px ${color})`}
        />
        {/* Score text */}
        {loading ? (
          <text x={cx} y={cy - 5} textAnchor="middle" fill="#888" fontSize="14" fontFamily="'Courier New', monospace">
            SCANNING...
          </text>
        ) : (
          <>
            <text x={cx} y={cy - 12} textAnchor="middle" fill={color} fontSize="36" fontWeight="bold" fontFamily="'Courier New', monospace">
              {score}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" fill={color} fontSize="13" fontFamily="'Courier New', monospace" letterSpacing="3">
              {label}
            </text>
          </>
        )}
        {/* Scale labels */}
        <text x="10" y={cy + 20} fill="#444" fontSize="10" fontFamily="monospace">0</text>
        <text x="182" y={cy + 20} fill="#444" fontSize="10" fontFamily="monospace">100</text>
      </svg>
    </div>
  );
}

// ============================================================
// FLAG ITEM — individual risk flag display
// ============================================================
function FlagItem({ label, status, critical = false, description }) {
  const [hover, setHover] = useState(false);
  const isGood = status === "PASS";
  const color = isGood ? "#00ff88" : critical ? "#ff3355" : "#ffcc00";
  const icon = isGood ? "✓" : critical ? "✕" : "⚠";

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        borderRadius: 6,
        background: hover ? "#0d1117" : "#080b10",
        border: `1px solid ${isGood ? "#1a2a1a" : critical ? "#2a1a1a" : "#2a2510"}`,
        cursor: "default",
        transition: "all 0.2s",
        position: "relative",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 22, height: 22,
          borderRadius: "50%",
          background: `${color}18`,
          border: `1px solid ${color}44`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, color,
          fontWeight: "bold",
        }}>
          {icon}
        </span>
        <span style={{ color: "#ccc", fontSize: 13, fontFamily: "'Courier New', monospace" }}>{label}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {hover && description && (
          <span style={{ color: "#666", fontSize: 11, maxWidth: 180, textAlign: "right", fontFamily: "monospace" }}>
            {description}
          </span>
        )}
        <span style={{
          fontSize: 11,
          color,
          fontFamily: "monospace",
          letterSpacing: 1,
          background: `${color}11`,
          padding: "2px 8px",
          borderRadius: 4,
          border: `1px solid ${color}33`,
        }}>
          {status}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// HOLDER BAR — top holders visualization
// ============================================================
function HolderBar({ rank, address, percentage }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
      <span style={{ color: "#444", fontSize: 11, fontFamily: "monospace", width: 20 }}>#{rank}</span>
      <span style={{ color: "#555", fontSize: 11, fontFamily: "monospace", width: 90, overflow: "hidden", textOverflow: "ellipsis" }}>
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <div style={{ flex: 1, height: 6, background: "#111", borderRadius: 3, overflow: "hidden" }}>
        <div style={{
          height: "100%",
          width: `${Math.min(100, percentage)}%`,
          background: percentage > 20 ? "#ff3355" : percentage > 10 ? "#ffcc00" : "#00ff88",
          borderRadius: 3,
          transition: "width 0.8s ease",
          boxShadow: `0 0 6px ${percentage > 20 ? "#ff3355" : percentage > 10 ? "#ffcc00" : "#00ff88"}`,
        }} />
      </div>
      <span style={{ color: "#888", fontSize: 11, fontFamily: "monospace", width: 40, textAlign: "right" }}>
        {percentage?.toFixed(1)}%
      </span>
    </div>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function RiskAssessment({ 
  initialAddress = "",
  chain = "solana",         // "solana" | "ethereum" | "bsc" | "arbitrum"
  birdeyeApiKey = "",       // optional: your Birdeye API key
  onScoreUpdate = null,     // callback: (score) => void
}) {
  const [address, setAddress] = useState(initialAddress);
  const [inputVal, setInputVal] = useState(initialAddress);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const scanCount = useRef(0);

  const analyze = useCallback(async (addr) => {
    if (!addr || addr.length < 10) return;
    setLoading(true);
    setError(null);
    setResult(null);
    scanCount.current += 1;

    try {
      // Parallel fetch — all APIs at once
      const [goplusData, honeypotData, dexData, holdersData] = await Promise.allSettled([
        fetchGoPlusSecurity(addr, chain),
        chain !== "solana" ? fetchHoneypotStatus(addr, chain === "ethereum" ? "1" : chain === "bsc" ? "56" : "42161") : Promise.resolve(null),
        fetchDexScreener(addr),
        fetchBirdeyeHolders(addr, birdeyeApiKey),
      ]);

      const gp = goplusData.value;
      const hp = honeypotData.value;
      const dex = dexData.value;
      const holders = holdersData.value;

      // Extract pairs from DexScreener
      const pairs = dex?.pairs || [];
      const bestPair = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];

      // Build flags from GoPlus data
      const flags = {
        isHoneypot: gp?.is_honeypot === "1" || hp?.isHoneypot === true,
        mintAuthorityActive: gp?.metadata_mutable === "1" || gp?.mint_authority !== null,
        freezeAuthorityActive: gp?.freeze_authority !== null && gp?.freeze_authority !== "",
        liquidityNotLocked: !bestPair?.liquidity?.usd || bestPair.liquidity.usd < 10000,
        top10Over80pct: parseFloat(gp?.holder_percent || 0) > 80,
        top10Over50pct: parseFloat(gp?.holder_percent || 0) > 50,
        blacklistFunction: gp?.transfer_pausable === "1",
        pausable: gp?.transfer_pausable === "1",
        proxyContract: gp?.is_proxy === "1",
      };

      const score = computeTrustScore(flags);
      if (onScoreUpdate) onScoreUpdate(score);

      // Build holders list
      const holderList = holders?.data?.items?.map((h, i) => ({
        rank: i + 1,
        address: h.address || h.owner,
        percentage: h.percentage * 100 || h.uiAmount,
      })) || [];

      setResult({
        score,
        flags,
        token: {
          name: gp?.token_name || bestPair?.baseToken?.name || "Unknown",
          symbol: gp?.token_symbol || bestPair?.baseToken?.symbol || "???",
          address: addr,
          liquidity: bestPair?.liquidity?.usd || 0,
          price: bestPair?.priceUsd || "N/A",
          priceChange24h: bestPair?.priceChange?.h24 || 0,
          volume24h: bestPair?.volume?.h24 || 0,
          dex: bestPair?.dexId || "Unknown",
          chain: bestPair?.chainId || chain,
        },
        raw: { gp, hp, dex },
        holders: holderList,
        scannedAt: new Date().toISOString(),
      });
    } catch (e) {
      setError("Analysis failed. Check address and try again.");
    } finally {
      setLoading(false);
    }
  }, [chain, birdeyeApiKey, onScoreUpdate]);

  useEffect(() => {
    if (initialAddress) analyze(initialAddress);
  }, []);

  const handleSubmit = () => {
    setAddress(inputVal.trim());
    analyze(inputVal.trim());
  };

  const score = result?.score ?? 0;
  const color = getScoreColor(score);

  return (
    <div style={{
      background: "#050709",
      border: "1px solid #1a1f2e",
      borderRadius: 12,
      overflow: "hidden",
      fontFamily: "'Courier New', monospace",
      maxWidth: 720,
      width: "100%",
      boxShadow: "0 0 40px rgba(0,0,0,0.8)",
    }}>
      {/* Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid #111827",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#070a0f",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff3355", boxShadow: "0 0 8px #ff3355" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffcc00", boxShadow: "0 0 8px #ffcc00" }} />
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 8px #00ff88" }} />
          <span style={{ color: "#444", marginLeft: 8, fontSize: 12, letterSpacing: 2 }}>SECURITY ENGINE v2.1</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {["solana", "ethereum", "bsc", "arbitrum"].map(c => (
            <span key={c} style={{
              fontSize: 10, padding: "3px 8px", borderRadius: 4,
              background: c === chain ? "#00ff8818" : "transparent",
              border: `1px solid ${c === chain ? "#00ff8844" : "#1a1f2e"}`,
              color: c === chain ? "#00ff88" : "#333",
              letterSpacing: 1,
            }}>{c.toUpperCase()}</span>
          ))}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding: "16px 20px", borderBottom: "1px solid #0d1117" }}>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, position: "relative" }}>
            <span style={{
              position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)",
              color: "#333", fontSize: 13,
            }}>$</span>
            <input
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSubmit()}
              placeholder="Paste token address..."
              style={{
                width: "100%",
                background: "#080b10",
                border: "1px solid #1a1f2e",
                borderRadius: 6,
                padding: "10px 12px 10px 28px",
                color: "#00ff88",
                fontSize: 13,
                fontFamily: "monospace",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              background: loading ? "#111" : "#00ff8811",
              border: `1px solid ${loading ? "#1a1f2e" : "#00ff8844"}`,
              borderRadius: 6,
              padding: "10px 20px",
              color: loading ? "#444" : "#00ff88",
              fontSize: 12,
              letterSpacing: 2,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
            }}
          >
            {loading ? "SCANNING..." : "ANALYZE →"}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding: "12px 20px", background: "#1a080a", borderBottom: "1px solid #2a1015", color: "#ff3355", fontSize: 12 }}>
          ⚠ {error}
        </div>
      )}

      {/* Loading animation */}
      {loading && (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ color: "#00ff88", fontSize: 12, letterSpacing: 3, marginBottom: 20 }}>
            NEURAL SCAN IN PROGRESS
          </div>
          {["Fetching token metadata...", "Checking honeypot status...", "Analyzing authority flags...", "Scanning top holders...", "Computing trust score..."].map((step, i) => (
            <div key={i} style={{
              color: "#333",
              fontSize: 11,
              padding: "4px 0",
              animation: `fadeIn 0.3s ease ${i * 0.3}s both`,
            }}>
              › {step}
            </div>
          ))}
          <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateX(-10px); } to { opacity: 1; transform: none; } }`}</style>
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <>
          {/* Token info bar */}
          <div style={{
            padding: "12px 20px",
            background: "#070a0f",
            borderBottom: "1px solid #0d1117",
            display: "flex",
            alignItems: "center",
            gap: 16,
            flexWrap: "wrap",
          }}>
            <div>
              <span style={{ color: "#fff", fontSize: 15, fontWeight: "bold" }}>{result.token.name}</span>
              <span style={{ color: "#444", fontSize: 12, marginLeft: 8 }}>${result.token.symbol}</span>
            </div>
            <div style={{ display: "flex", gap: 16, marginLeft: "auto", flexWrap: "wrap" }}>
              {[
                { label: "PRICE", value: `$${result.token.price}` },
                { label: "LIQ", value: `$${(result.token.liquidity / 1000).toFixed(1)}k` },
                { label: "VOL 24H", value: `$${(result.token.volume24h / 1000).toFixed(1)}k` },
                { label: "DEX", value: result.token.dex.toUpperCase() },
              ].map(({ label, value }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ color: "#333", fontSize: 9, letterSpacing: 2 }}>{label}</div>
                  <div style={{ color: "#aaa", fontSize: 12 }}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #0d1117" }}>
            {["overview", "flags", "holders"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: `2px solid ${activeTab === tab ? color : "transparent"}`,
                  padding: "10px 20px",
                  color: activeTab === tab ? color : "#333",
                  fontSize: 11,
                  letterSpacing: 2,
                  cursor: "pointer",
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div style={{ padding: 20 }}>

            {/* OVERVIEW TAB */}
            {activeTab === "overview" && (
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                <div style={{ flex: "0 0 auto" }}>
                  <TrustGauge score={result.score} loading={false} />
                  <div style={{ textAlign: "center", marginTop: 4 }}>
                    <span style={{ color: "#333", fontSize: 10, letterSpacing: 2 }}>TRUST SCORE</span>
                  </div>
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ color: "#444", fontSize: 10, letterSpacing: 2, marginBottom: 8 }}>CRITICAL FLAGS</div>
                    {Object.entries(result.flags)
                      .filter(([, v]) => v)
                      .slice(0, 4)
                      .map(([flag]) => (
                        <div key={flag} style={{ color: "#ff3355", fontSize: 12, padding: "3px 0" }}>
                          ✕ {flag.replace(/([A-Z])/g, ' $1').toUpperCase()}
                        </div>
                      ))}
                    {Object.values(result.flags).every(v => !v) && (
                      <div style={{ color: "#00ff88", fontSize: 12 }}>✓ NO CRITICAL FLAGS DETECTED</div>
                    )}
                  </div>
                  <div style={{
                    padding: "10px 14px",
                    background: "#080b10",
                    border: `1px solid ${color}22`,
                    borderRadius: 6,
                    borderLeft: `3px solid ${color}`,
                  }}>
                    <div style={{ color: "#444", fontSize: 10, letterSpacing: 2, marginBottom: 4 }}>RECOMMENDATION</div>
                    <div style={{ color, fontSize: 13 }}>
                      {result.score >= 80 && "Token appears safe. Proceed with normal caution."}
                      {result.score >= 60 && result.score < 80 && "Elevated risk detected. DYOR before investing."}
                      {result.score >= 40 && result.score < 60 && "High risk token. Multiple red flags found."}
                      {result.score < 40 && "EXTREME RISK. Possible scam or rug pull detected."}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FLAGS TAB */}
            {activeTab === "flags" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <FlagItem
                  label="Honeypot Check"
                  status={result.flags.isHoneypot ? "FAIL" : "PASS"}
                  critical={true}
                  description="Can you sell this token?"
                />
                <FlagItem
                  label="Mint Authority"
                  status={result.flags.mintAuthorityActive ? "ACTIVE" : "PASS"}
                  critical={true}
                  description="Dev can mint unlimited supply"
                />
                <FlagItem
                  label="Freeze Authority"
                  status={result.flags.freezeAuthorityActive ? "ACTIVE" : "PASS"}
                  critical={true}
                  description="Dev can freeze your tokens"
                />
                <FlagItem
                  label="Liquidity Lock"
                  status={result.flags.liquidityNotLocked ? "UNLOCKED" : "PASS"}
                  critical={false}
                  description="LP tokens not locked"
                />
                <FlagItem
                  label="Top 10 Concentration"
                  status={result.flags.top10Over80pct ? "CRITICAL" : result.flags.top10Over50pct ? "HIGH" : "PASS"}
                  critical={result.flags.top10Over80pct}
                  description="Top 10 holders own >50% supply"
                />
                <FlagItem
                  label="Blacklist Function"
                  status={result.flags.blacklistFunction ? "FOUND" : "PASS"}
                  critical={false}
                  description="Contract can blacklist wallets"
                />
                <FlagItem
                  label="Proxy Contract"
                  status={result.flags.proxyContract ? "DETECTED" : "PASS"}
                  critical={false}
                  description="Upgradeable proxy pattern found"
                />
              </div>
            )}

            {/* HOLDERS TAB */}
            {activeTab === "holders" && (
              <div>
                <div style={{ color: "#333", fontSize: 10, letterSpacing: 2, marginBottom: 12 }}>
                  TOP HOLDERS DISTRIBUTION
                </div>
                {result.holders.length > 0 ? (
                  result.holders.map(h => (
                    <HolderBar key={h.rank} {...h} />
                  ))
                ) : (
                  <div style={{ color: "#444", fontSize: 12, textAlign: "center", padding: "20px 0" }}>
                    Holder data requires Birdeye API key
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{
            padding: "10px 20px",
            borderTop: "1px solid #0d1117",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ color: "#222", fontSize: 10, letterSpacing: 1 }}>
              SCANNED {new Date(result.scannedAt).toLocaleTimeString()} · CRYPTOCHECK.AI
            </span>
            <span style={{ color: "#222", fontSize: 10 }}>
              CACHE TTL: 5MIN · SCAN #{scanCount.current}
            </span>
          </div>
        </>
      )}

      {/* Empty state */}
      {!result && !loading && !error && (
        <div style={{ padding: "40px 20px", textAlign: "center" }}>
          <div style={{ color: "#1a1f2e", fontSize: 48, marginBottom: 16 }}>⬡</div>
          <div style={{ color: "#333", fontSize: 12, letterSpacing: 3 }}>PASTE A TOKEN ADDRESS TO BEGIN ANALYSIS</div>
          <div style={{ color: "#222", fontSize: 11, marginTop: 8 }}>
            Supports Solana · Ethereum · BSC · Arbitrum
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// USAGE EXAMPLE:
//
// import RiskAssessment from "./RiskAssessment";
//
// <RiskAssessment
//   initialAddress="EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
//   chain="solana"
//   birdeyeApiKey={process.env.NEXT_PUBLIC_BIRDEYE_KEY}
//   onScoreUpdate={(score) => console.log("Score:", score)}
// />
// ============================================================
