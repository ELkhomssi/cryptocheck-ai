import { useState, useEffect, useRef, useCallback } from "react";

const txCache = new Map();
const TX_CACHE_TTL = 8_000;
function getCachedTxs(address) {
  const entry = txCache.get(address);
  if (!entry || Date.now() - entry.ts > TX_CACHE_TTL) return null;
  return entry.txs;
}

let mockTxId = 1000;
function generateMockTx(basePrice = 0.001) {
  const isBuy = Math.random() > 0.45;
  const solAmount = Math.random() * 50 + 0.01;
  const usdAmount = solAmount * 150;
  const wallets = ["7xKX...a9Pm","3mNq...k2Rz","BcPw...j8Yt","5rVs...x1Lm","Aq2F...n7Kp","9wDe...b4Hj"];
  return {
    id: `mock_${mockTxId++}_${Date.now()}`,
    signature: `${Math.random().toString(36).substr(2,8)}...${Math.random().toString(36).substr(2,4)}`,
    type: isBuy ? "BUY" : "SELL",
    tokenAmount: (usdAmount / basePrice).toFixed(0),
    amountUsd: usdAmount,
    solAmount: solAmount.toFixed(4),
    wallet: wallets[Math.floor(Math.random() * wallets.length)],
    time: Date.now(),
    dex: ["Raydium","Orca","Jupiter","Meteora"][Math.floor(Math.random() * 4)],
    isNew: true,
  };
}

function formatUsd(n) {
  if (n >= 1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n/1_000).toFixed(2)}K`;
  return `$${n.toFixed(2)}`;
}
function formatAge(ts) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return `${Math.floor(diff/1000)}s ago`;
  if (diff < 3_600_000) return `${Math.floor(diff/60_000)}m ago`;
  return `${Math.floor(diff/3_600_000)}h ago`;
}

function TxRow({ tx }) {
  const isBuy = tx.type === "BUY";
  const color = isBuy ? "#00ff88" : "#ff3355";
  return (
    <div style={{
      display:"grid", gridTemplateColumns:"60px 1fr 1fr 1fr 80px 70px",
      alignItems:"center", padding:"8px 16px",
      background: tx.isNew ? (isBuy ? "rgba(0,255,136,0.04)" : "rgba(255,51,85,0.04)") : "transparent",
      borderBottom:"1px solid #0a0e15",
      borderLeft: tx.isNew ? `2px solid ${color}` : "2px solid transparent",
      transition:"all 0.5s ease", fontSize:12,
      fontFamily:"'Courier New', monospace", gap:8,
    }}>
      <div style={{ display:"inline-flex", alignItems:"center", justifyContent:"center",
        padding:"3px 8px", borderRadius:4, background:`${color}15`,
        border:`1px solid ${color}33`, color, fontSize:10, letterSpacing:1, fontWeight:"bold" }}>
        {isBuy ? "▲" : "▼"} {tx.type}
      </div>
      <div style={{ color, fontWeight:"bold" }}>{formatUsd(tx.amountUsd)}</div>
      <div style={{ color:"#666" }}>{parseInt(tx.tokenAmount||0).toLocaleString()} <span style={{color:"#333",fontSize:10}}>tkns</span></div>
      <div style={{ color:"#555", fontSize:11 }}>{tx.wallet}</div>
      <div style={{ color:"#444", fontSize:10, letterSpacing:1, textAlign:"center" }}>{tx.dex}</div>
      <div style={{ color:"#333", fontSize:10, textAlign:"right" }}>{formatAge(tx.time)}</div>
    </div>
  );
}

function BuySellBar({ txs }) {
  const buys = txs.filter(t => t.type === "BUY").length;
  const total = txs.length || 1;
  const buyPct = (buys / total) * 100;
  const buyVol = txs.filter(t => t.type === "BUY").reduce((s,t) => s + t.amountUsd, 0);
  const sellVol = txs.filter(t => t.type === "SELL").reduce((s,t) => s + t.amountUsd, 0);
  return (
    <div style={{ padding:"10px 16px", borderBottom:"1px solid #0a0e15" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
        <span style={{ color:"#00ff88", fontSize:11, fontFamily:"monospace" }}>▲ {buys} BUYS · {formatUsd(buyVol)}</span>
        <span style={{ color:"#ff3355", fontSize:11, fontFamily:"monospace" }}>{txs.length - buys} SELLS · {formatUsd(sellVol)} ▼</span>
      </div>
      <div style={{ height:4, borderRadius:2, overflow:"hidden", background:"#0a0e15", display:"flex" }}>
        <div style={{ width:`${buyPct}%`, background:"#00ff88", transition:"width 0.5s ease" }} />
        <div style={{ width:`${100-buyPct}%`, background:"#ff3355" }} />
      </div>
    </div>
  );
}

export default function LiveTransactionsFeed({ tokenPrice = 0.001, maxTxs = 50, useMockData = true }) {
  const [txs, setTxs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("ALL");
  const [totalVolume, setTotalVolume] = useState(0);
  const [txCount, setTxCount] = useState(0);
  const intervalRef = useRef(null);
  const pausedRef = useRef(false);
  pausedRef.current = isPaused;

  const addTx = useCallback((newTx) => {
    if (pausedRef.current) return;
    setTxs(prev => {
      const updated = [{ ...newTx, isNew: true }, ...prev.slice(0, maxTxs - 1)];
      setTimeout(() => setTxs(curr => curr.map(t => t.id === newTx.id ? { ...t, isNew: false } : t)), 1500);
      return updated;
    });
    setTotalVolume(v => v + newTx.amountUsd);
    setTxCount(c => c + 1);
  }, [maxTxs]);

  useEffect(() => {
    setIsConnected(true);
    for (let i = 0; i < 8; i++) setTimeout(() => addTx(generateMockTx(tokenPrice)), i * 100);
    const stream = () => {
      if (!pausedRef.current) addTx(generateMockTx(tokenPrice));
      intervalRef.current = setTimeout(stream, 800 + Math.random() * 3200);
    };
    intervalRef.current = setTimeout(stream, 1000);
    return () => { clearTimeout(intervalRef.current); setIsConnected(false); };
  }, []);

  const filtered = txs.filter(tx => filter === "ALL" || tx.type === filter);

  return (
    <div style={{ background:"#050709", border:"1px solid #0f1520", borderRadius:12, overflow:"hidden", fontFamily:"'Courier New', monospace", width:"100%" }}>
      <style>{`@keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #0a0e15", display:"flex", alignItems:"center", justifyContent:"space-between", background:"#070a0f", flexWrap:"wrap", gap:8 }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background: isConnected ? "#00ff88" : "#ff3355", boxShadow: isConnected ? "0 0 8px #00ff88" : "none", animation:"pulse 2s infinite" }} />
          <span style={{ color:"#888", fontSize:11, letterSpacing:2 }}>LIVE TRANSACTIONS</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:"#444", fontSize:11 }}>VOL: <span style={{color:"#00ff88"}}>{formatUsd(totalVolume)}</span></span>
          <span style={{ color:"#444", fontSize:11 }}>TXS: <span style={{color:"#888"}}>{txCount}</span></span>
          <button onClick={() => setIsPaused(p => !p)} style={{ background: isPaused ? "#ff330511" : "#00ff8811", border:`1px solid ${isPaused ? "#ff330544" : "#00ff8833"}`, borderRadius:4, padding:"4px 10px", color: isPaused ? "#ff3355" : "#00ff88", fontSize:10, letterSpacing:1, cursor:"pointer" }}>
            {isPaused ? "▶ RESUME" : "⏸ PAUSE"}
          </button>
        </div>
      </div>
      <div style={{ padding:"8px 16px", borderBottom:"1px solid #0a0e15", display:"flex", gap:8 }}>
        {["ALL","BUY","SELL"].map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter===f ? (f==="BUY"?"#00ff8818":f==="SELL"?"#ff335518":"#ffffff08") : "transparent", border:`1px solid ${filter===f?(f==="BUY"?"#00ff8844":f==="SELL"?"#ff335544":"#ffffff22"):"#1a1f2e"}`, borderRadius:4, padding:"4px 12px", color: filter===f?(f==="BUY"?"#00ff88":f==="SELL"?"#ff3355":"#888"):"#333", fontSize:10, letterSpacing:1, cursor:"pointer" }}>
            {f}
          </button>
        ))}
      </div>
      <BuySellBar txs={filtered} />
      <div style={{ display:"grid", gridTemplateColumns:"60px 1fr 1fr 1fr 80px 70px", padding:"6px 16px", borderBottom:"1px solid #0a0e15", gap:8 }}>
        {["TYPE","USD","AMOUNT","WALLET","DEX","TIME"].map(h => <span key={h} style={{color:"#222",fontSize:9,letterSpacing:2}}>{h}</span>)}
      </div>
      <div style={{ maxHeight:400, overflowY:"auto", scrollbarWidth:"thin", scrollbarColor:"#1a1f2e transparent" }}>
        {filtered.length === 0
          ? <div style={{padding:"40px 20px",textAlign:"center",color:"#222",fontSize:12}}>{isPaused ? "Feed paused..." : "Waiting..."}</div>
          : filtered.map((tx,i) => <TxRow key={tx.id||i} tx={tx} />)
        }
      </div>
      <div style={{ padding:"8px 16px", borderTop:"1px solid #0a0e15", display:"flex", justifyContent:"space-between", background:"#070a0f" }}>
        <span style={{color:"#1a1f2e",fontSize:10}}>POWERED BY HELIUS · DEXSCREENER</span>
        <span style={{color:"#1a1f2e",fontSize:10}}>SHOWING {filtered.length} / {txs.length} TXS</span>
      </div>
    </div>
  );
}
