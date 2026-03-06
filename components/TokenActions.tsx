'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export function CopyAddress({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(address); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  };
  return (
    <button onClick={copy} style={{ background:copied?'rgba(20,241,149,0.15)':'rgba(255,255,255,0.04)', border:`1px solid ${copied?'rgba(20,241,149,0.4)':'rgba(255,255,255,0.08)'}`, borderRadius:4, padding:'3px 8px', color:copied?'#14f195':'rgba(255,255,255,0.3)', fontSize:10, fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, cursor:'pointer', transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap:4 }}>
      {copied ? '✓ COPIED' : '⎘ COPY'}
    </button>
  );
}

export function ShareVerdict({ symbol, score, mint, level }: { symbol:string; score:number; mint:string; level:string }) {
  const shareUrl = typeof window !== 'undefined' ? `${window.location.origin}/robot?mint=${mint}` : `https://cryptocheck.ai/robot?mint=${mint}`;
  const emoji = score >= 70 ? '🟢' : score >= 40 ? '🟡' : '🔴';
  const verdict = score >= 70 ? 'SAFE' : score >= 40 ? 'CAUTION' : 'DANGER';
  const tweet = encodeURIComponent(`Just scanned $${symbol} on @CryptoCheckAI\n\n${emoji} Safety Score: ${score}/100 — ${verdict}\n⚡ Neural Audit: ${shareUrl}\n\n#Solana #CryptoCheck #DeFi`);
  return (
    <a href={`https://twitter.com/intent/tweet?text=${tweet}`} target="_blank" rel="noopener noreferrer"
      style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 14px', background:'rgba(29,161,242,0.08)', border:'1px solid rgba(29,161,242,0.3)', borderRadius:6, color:'#1DA1F2', fontSize:11, fontFamily:"'Share Tech Mono',monospace", letterSpacing:1, textDecoration:'none', transition:'all 0.2s' }}
      onMouseEnter={e=>{(e.currentTarget as HTMLElement).style.background='rgba(29,161,242,0.15)';}}
      onMouseLeave={e=>{(e.currentTarget as HTMLElement).style.background='rgba(29,161,242,0.08)';}}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="#1DA1F2"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      SHARE VERDICT
    </a>
  );
}

interface SearchResult { address:string; name:string; symbol:string; price?:string; chain?:string; }

async function searchTokens(query: string): Promise<SearchResult[]> {
  if (!query || query.length < 2) return [];
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/search?q=${encodeURIComponent(query)}`);
    const json = await res.json();
    const seen = new Set<string>();
    return (json?.pairs || []).slice(0, 6).filter((p: any) => {
      const addr = p.baseToken?.address;
      if (!addr || seen.has(addr)) return false;
      seen.add(addr); return true;
    }).map((p: any) => ({
      address: p.baseToken.address,
      name: p.baseToken.name || 'Unknown',
      symbol: p.baseToken.symbol || '???',
      price: p.priceUsd ? `$${parseFloat(p.priceUsd).toFixed(6)}` : undefined,
      chain: p.chainId,
    }));
  } catch { return []; }
}

export function GlobalSearchBar({ onSelect }: { onSelect?: (mint: string, token: any) => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    setLoading(true);
    const res = await searchTokens(q);
    setResults(res);
    setOpen(res.length > 0);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(query), 350);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  const handleSelect = (result: SearchResult) => {
    setQuery(''); setOpen(false);
    if (onSelect) onSelect(result.address, result);
    else router.push(`/robot?mint=${result.address}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const q = query.trim();
      if (results.length > 0) handleSelect(results[0]);
      else if (q.length > 30) handleSelect({ address: q, name: 'Unknown', symbol: '???' });
    }
    if (e.key === 'Escape') { setOpen(false); setQuery(''); }
  };

  return (
    <div style={{ position:'relative' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(20,241,149,0.12)', borderRadius:6, padding:'6px 12px', transition:'all 0.2s' }}>
        <span style={{ color:'rgba(20,241,149,0.4)', fontSize:13 }}>⌕</span>
        <input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={handleKeyDown} onFocus={()=>query&&setOpen(true)}
          placeholder="Search token or paste address..."
          style={{ background:'transparent', border:'none', outline:'none', color:'rgba(255,255,255,0.8)', fontFamily:"'Share Tech Mono',monospace", fontSize:11, width:220, letterSpacing:0.5 }} />
        {loading && <div style={{ width:10, height:10, borderRadius:'50%', border:'1.5px solid #14f195', borderTopColor:'transparent', animation:'radarSpin 0.8s linear infinite' }} />}
      </div>
      {open && results.length > 0 && (
        <div style={{ position:'absolute', top:'100%', left:0, right:0, marginTop:4, background:'rgba(7,13,15,0.98)', border:'1px solid rgba(20,241,149,0.15)', borderRadius:8, overflow:'hidden', zIndex:1000, boxShadow:'0 16px 40px rgba(0,0,0,0.8)', backdropFilter:'blur(16px)', minWidth:280 }}>
          {results.map((r, i) => (
            <div key={r.address} onClick={()=>handleSelect(r)}
              onMouseEnter={e=>(e.currentTarget as HTMLElement).style.background='rgba(20,241,149,0.06)'}
              onMouseLeave={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
              style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', cursor:'pointer', borderBottom:i<results.length-1?'1px solid rgba(255,255,255,0.03)':'none', transition:'background 0.15s' }}>
              <div>
                <div style={{ color:'#e8eaf0', fontSize:13, fontWeight:600, fontFamily:'monospace' }}>
                  {r.symbol}<span style={{ color:'rgba(255,255,255,0.25)', fontSize:10, marginLeft:8 }}>{r.name}</span>
                </div>
                <div style={{ color:'rgba(255,255,255,0.2)', fontSize:9, marginTop:2, fontFamily:'monospace' }}>{r.address.slice(0,16)}...</div>
              </div>
              <div style={{ textAlign:'right' }}>
                {r.price && <div style={{ color:'#14f195', fontSize:11, fontFamily:'monospace' }}>{r.price}</div>}
                <div style={{ color:'rgba(255,255,255,0.15)', fontSize:9, textTransform:'uppercase' }}>{r.chain}</div>
              </div>
            </div>
          ))}
          <div style={{ padding:'6px 14px', color:'rgba(255,255,255,0.15)', fontSize:9, fontFamily:'monospace', borderTop:'1px solid rgba(255,255,255,0.03)' }}>
            PRESS ENTER TO SCAN · ESC TO CLOSE
          </div>
        </div>
      )}
    </div>
  );
}

export function useMintFromUrl() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const mintFromUrl = searchParams.get('mint') || '';
  const setMintInUrl = useCallback((mint: string) => {
    const params = new URLSearchParams();
    if (mint) params.set('mint', mint);
    router.replace(`/robot?${params.toString()}`, { scroll: false });
  }, [router]);
  return { mintFromUrl, setMintInUrl };
}
