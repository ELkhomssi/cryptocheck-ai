import { useState, useEffect, useRef, useCallback, useMemo } from "react";

const cache = new Map();
const CACHE_TTL = 30_000;
function getCached(key) { const e = cache.get(key); if (!e || Date.now()-e.ts > CACHE_TTL) return null; return e.data; }
function setCache(key, data) { cache.set(key, { data, ts: Date.now() }); }

function generateSparkline(change24h) {
  const arr = [50];
  for (let i = 1; i < 20; i++) arr.push(Math.max(10, Math.min(90, arr[i-1] + (change24h/20)*0.8 + (Math.random()-0.5)*8)));
  return arr;
}

function mapPairs(pairs) {
  const grouped = {};
  pairs.forEach(p => {
    const addr = p.baseToken?.address;
    if (!addr) return;
    if (!grouped[addr] || (p.liquidity?.usd||0) > (grouped[addr].liquidity?.usd||0)) grouped[addr] = p;
  });
  return Object.values(grouped).slice(0,20).map((p,i) => ({
    rank: i+1, address: p.baseToken?.address||"",
    name: p.baseToken?.name||"Unknown", symbol: p.baseToken?.symbol||"???",
    icon: `https://dd.dexscreener.com/ds-data/tokens/${p.chainId}/${p.baseToken?.address}.png`,
    price: parseFloat(p.priceUsd||0),
    change1h: p.priceChange?.h1||0, change6h: p.priceChange?.h6||0, change24h: p.priceChange?.h24||0,
    volume24h: p.volume?.h24||0, liquidity: p.liquidity?.usd||0, marketCap: p.marketCap||0,
    buys: p.txns?.h24?.buys||0, sells: p.txns?.h24?.sells||0,
    pairAddress: p.pairAddress||"", chain: p.chainId||"solana", dex: p.dexId||"",
    sparkline: generateSparkline(p.priceChange?.h24||0),
  }));
}

async function fetchTab(tab) {
  const cached = getCached(tab);
  if (cached) return cached;
  let pairs = [];
  try {
    if (tab === "trending") {
      const r = await fetch("https://api.dexscreener.com/token-boosts/top/v1");
      const j = await r.json();
      const addrs = (j||[]).slice(0,20).map(t=>t.tokenAddress).join(",");
      if (addrs) { const r2 = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${addrs}`); const j2 = await r2.json(); pairs = j2?.pairs||[]; }
    } else {
      const q = tab==="top_gainers"?"solana":tab==="whale_buys"?"sol":"solana";
      const r = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${q}`);
      const j = await r.json();
      pairs = j?.pairs||[];
      if (tab==="top_gainers") pairs = pairs.filter(p=>p.priceChange?.h24>0).sort((a,b)=>(b.priceChange?.h24||0)-(a.priceChange?.h24||0));
      if (tab==="whale_buys") pairs = pairs.filter(p=>(p.volume?.h24||0)>100000&&(p.txns?.h24?.buys||0)>(p.txns?.h24?.sells||0)).sort((a,b)=>(b.volume?.h24||0)-(a.volume?.h24||0));
    }
  } catch {}
  const data = mapPairs(pairs);
  setCache(tab, data);
  return data;
}

function fmtPrice(n) {
  if (!n||isNaN(n)) return "$0.00";
  if (n>=1000) return `$${n.toLocaleString("en",{maximumFractionDigits:2})}`;
  if (n>=1) return `$${n.toFixed(4)}`;
  if (n>=0.0001) return `$${n.toFixed(6)}`;
  return `$${n.toExponential(2)}`;
}
function fmtUsd(n) {
  if (!n) return "$0";
  if (n>=1_000_000_000) return `$${(n/1_000_000_000).toFixed(2)}B`;
  if (n>=1_000_000) return `$${(n/1_000_000).toFixed(2)}M`;
  if (n>=1_000) return `$${(n/1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}
function fmtChange(n) { if (!n&&n!==0) return "—"; return `${n>=0?"+":""}${n.toFixed(2)}%`; }

function Sparkline({ data, positive }) {
  if (!data||data.length<2) return null;
  const w=80,h=28,min=Math.min(...data),max=Math.max(...data),range=max-min||1;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*w},${h-((v-min)/range)*h}`).join(" ");
  const color = positive?"#00ff88":"#ff3355";
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" style={{filter:`drop-shadow(0 0 3px ${color})`}} />
    </svg>
  );
}

function SkeletonRow() {
  return (
    <div style={{display:"grid",gridTemplateColumns:"32px 1fr 100px 70px 70px 70px 80px 90px 60px",padding:"12px 20px",gap:12,borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
      {[30,140,80,60,60,60,70,70,50].map((w,i) => <div key={i} style={{height:14,width:w,borderRadius:4,background:"rgba(255,255,255,0.05)",animation:"shimmer 1.5s ease infinite"}} />)}
    </div>
  );
}

function ChangeCell({ value }) {
  const pos = value>=0;
  return (
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:pos?"#00ff88":"#ff3355",background:pos?"rgba(0,255,136,0.06)":"rgba(255,51,85,0.06)",borderRadius:4,padding:"3px 6px",textAlign:"center",whiteSpace:"nowrap"}}>
      {fmtChange(value)}
    </div>
  );
}

function QuickSwapModal({ token, onClose }) {
  if (!token) return null;
  return (
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.85)",backdropFilter:"blur(12px)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div onClick={e=>e.stopPropagation()} style={{background:"linear-gradient(135deg,rgba(10,14,20,0.98),rgba(6,10,15,0.98))",border:"1px solid rgba(0,255,136,0.2)",borderRadius:16,padding:28,width:"100%",maxWidth:400,fontFamily:"'JetBrains Mono',monospace",boxShadow:"0 0 60px rgba(0,255,136,0.1)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24}}>
          <div style={{color:"#fff",fontSize:15,fontWeight:600}}>{token.symbol} <span style={{color:"#444",fontSize:11}}>{token.name}</span></div>
          <button onClick={onClose} style={{background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"4px 10px",color:"#666",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{marginBottom:16,padding:"12px 14px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <input defaultValue="0.1" style={{background:"transparent",border:"none",color:"#fff",fontSize:20,fontFamily:"'JetBrains Mono',monospace",outline:"none",width:120}} />
          <span style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:6,padding:"4px 10px",color:"#aaa",fontSize:13}}>SOL</span>
        </div>
        <div style={{textAlign:"center",color:"#333",fontSize:16,marginBottom:16}}>⇅</div>
        <div style={{marginBottom:20,padding:"12px 14px",background:"rgba(0,255,136,0.03)",border:"1px solid rgba(0,255,136,0.12)",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{color:"#00ff88",fontSize:20}}>~{(0.1*150/Math.max(token.price,0.000001)).toFixed(0)}</span>
          <span style={{background:"rgba(0,255,136,0.08)",border:"1px solid rgba(0,255,136,0.2)",borderRadius:6,padding:"4px 10px",color:"#00ff88",fontSize:13}}>{token.symbol}</span>
        </div>
        <button style={{width:"100%",padding:14,background:"linear-gradient(135deg,rgba(0,255,136,0.2),rgba(0,255,136,0.1))",border:"1px solid rgba(0,255,136,0.4)",borderRadius:10,color:"#00ff88",fontSize:13,letterSpacing:2,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",fontWeight:600}}>
          CONNECT WALLET TO SWAP
        </button>
      </div>
    </div>
  );
}

const TABS = [
  {id:"trending",label:"Trending",icon:"🔥"},
  {id:"new_pairs",label:"New Pairs",icon:"🚀"},
  {id:"top_gainers",label:"Top Gainers",icon:"💎"},
  {id:"whale_buys",label:"Whale Buys",icon:"🐋"},
];

export default function MarketDashboard({ onTokenSelect }) {
  const [activeTab, setActiveTab] = useState("trending");
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [swapToken, setSwapToken] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check(); window.addEventListener("resize",check);
    return () => window.removeEventListener("resize",check);
  }, []);

  const fetchData = useCallback(async (tab) => {
    setLoading(true); setError(null);
    try { const data = await fetchTab(tab); setTokens(data); }
    catch { setError("Failed to load market data."); setTokens([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData(activeTab);
    const iv = setInterval(() => fetchData(activeTab), 30_000);
    return () => clearInterval(iv);
  }, [activeTab, fetchData]);

  const filtered = useMemo(() => {
    if (!search.trim()) return tokens;
    const q = search.toLowerCase();
    return tokens.filter(t => t.name.toLowerCase().includes(q)||t.symbol.toLowerCase().includes(q)||t.address.toLowerCase().includes(q));
  }, [tokens, search]);

  const cols = isMobile ? "32px 1fr 90px 70px 70px 60px" : "32px 1fr 100px 70px 70px 70px 80px 90px 90px 60px";
  const headers = isMobile ? ["#","TOKEN","PRICE","1H","24H",""] : ["#","TOKEN","PRICE","1H","6H","24H","VOLUME","LIQUIDITY","CHART",""];

  return (
    <>
      <style>{`@keyframes shimmer{0%,100%{opacity:0.4}50%{opacity:0.8}} @keyframes fadeSlideIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}`}</style>
      <div style={{background:"linear-gradient(160deg,rgba(8,12,20,0.95),rgba(5,8,14,0.98))",backdropFilter:"blur(20px)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:16,overflow:"hidden",fontFamily:"'JetBrains Mono',monospace",boxShadow:"0 24px 80px rgba(0,0,0,0.6)",position:"relative"}}>
        <div style={{position:"absolute",top:0,left:"10%",right:"10%",height:1,background:"linear-gradient(90deg,transparent,rgba(0,255,136,0.3),transparent)",pointerEvents:"none"}} />

        {/* Header */}
        <div style={{padding:"20px 20px 0",borderBottom:"1px solid rgba(255,255,255,0.04)"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:12}}>
            <h2 style={{margin:0,color:"#e8eaf0",fontSize:isMobile?16:20,fontWeight:700}}>Market Dashboard</h2>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search token..." style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:8,padding:"8px 12px",color:"#c8cad8",fontSize:12,fontFamily:"'JetBrains Mono',monospace",outline:"none",width:isMobile?160:220}} />
          </div>
          <div style={{display:"flex",gap:2,overflowX:"auto",scrollbarWidth:"none"}}>
            {TABS.map(tab => (
              <button key={tab.id} onClick={() => {setActiveTab(tab.id);setSearch("");}} style={{background:activeTab===tab.id?"rgba(0,255,136,0.08)":"transparent",border:"none",borderBottom:`2px solid ${activeTab===tab.id?"#00ff88":"transparent"}`,padding:"10px 16px",color:activeTab===tab.id?"#00ff88":"#2a3040",fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.2s",display:"flex",alignItems:"center",gap:6}}>
                {tab.icon} {!isMobile && tab.label}
              </button>
            ))}
            <button onClick={()=>fetchData(activeTab)} style={{marginLeft:"auto",background:"transparent",border:"none",color:"#2a3040",fontSize:14,cursor:"pointer",padding:"10px 12px"}}>↻</button>
          </div>
        </div>

        {/* Column headers */}
        <div style={{display:"grid",gridTemplateColumns:cols,padding:"8px 20px",gap:12,borderBottom:"1px solid rgba(255,255,255,0.04)",background:"rgba(0,0,0,0.2)"}}>
          {headers.map((h,i) => <div key={i} style={{color:"#1e2535",fontSize:9,letterSpacing:2}}>{h}</div>)}
        </div>

        {/* Rows */}
        <div style={{maxHeight:520,overflowY:"auto",scrollbarWidth:"thin",scrollbarColor:"#1a1f2e transparent"}}>
          {error && <div style={{padding:"40px 20px",textAlign:"center",color:"#ff3355",fontSize:12}}>⚠ {error}</div>}
          {loading && Array.from({length:8},(_,i) => <SkeletonRow key={i} />)}
          {!loading && !error && filtered.length===0 && <div style={{padding:"60px 20px",textAlign:"center",color:"#1e2535",fontSize:12}}>No tokens found</div>}
          {!loading && !error && filtered.map((token,i) => (
            <div key={token.address} onClick={()=>onTokenSelect&&onTokenSelect(token)} style={{display:"grid",gridTemplateColumns:cols,padding:"11px 20px",gap:12,borderBottom:"1px solid rgba(255,255,255,0.03)",cursor:"pointer",alignItems:"center",animation:"fadeSlideIn 0.25s ease both",animationDelay:`${i*0.03}s",transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.background="rgba(255,255,255,0.03)"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <span style={{color:"#2a3040",fontSize:12,fontFamily:"'JetBrains Mono',monospace"}}>{String(token.rank).padStart(2,"0")}</span>
              <div style={{display:"flex",alignItems:"center",gap:10,minWidth:0}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:"#0d1520",border:"1px solid rgba(255,255,255,0.06)",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <img src={token.icon} alt="" width={28} height={28} style={{borderRadius:"50%"}} onError={e=>{e.target.style.display="none";}} />
                </div>
                <div style={{minWidth:0}}>
                  <div style={{color:"#e8eaf0",fontSize:13,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{token.symbol}</div>
                  <div style={{color:"#2a3040",fontSize:10,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{token.name}</div>
                </div>
              </div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#c8cad8",textAlign:"right"}}>{fmtPrice(token.price)}</div>
              <ChangeCell value={token.change1h} />
              {!isMobile && <ChangeCell value={token.change6h} />}
              <ChangeCell value={token.change24h} />
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#8891a8",textAlign:"right"}}>{fmtUsd(token.volume24h)}</div>
              {!isMobile && <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:"#556070",textAlign:"right"}}>{fmtUsd(token.liquidity)}</div>}
              {!isMobile && <div style={{display:"flex",justifyContent:"center"}}><Sparkline data={token.sparkline} positive={token.change24h>=0} /></div>}
              <div style={{display:"flex",justifyContent:"flex-end"}}>
                <button onClick={e=>{e.stopPropagation();setSwapToken(token);}} style={{background:"rgba(0,255,136,0.06)",border:"1px solid rgba(0,255,136,0.15)",borderRadius:6,padding:"5px 12px",color:"#00ff88",fontSize:10,letterSpacing:1,cursor:"pointer"}}>BUY</button>
              </div>
            </div>
          ))}
        </div>

        <div style={{padding:"10px 20px",borderTop:"1px solid rgba(255,255,255,0.03)",display:"flex",justifyContent:"space-between",background:"rgba(0,0,0,0.2)"}}>
          <span style={{color:"#131820",fontSize:10}}>DEXSCREENER API · CACHE 30S</span>
          <span style={{color:"#131820",fontSize:10}}>{filtered.length} PAIRS · CRYPTOCHECK.AI</span>
        </div>
      </div>
      {swapToken && <QuickSwapModal token={swapToken} onClose={()=>setSwapToken(null)} />}
    </>
  );
}
