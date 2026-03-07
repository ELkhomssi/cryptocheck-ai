'use client';
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTokenStore } from '@/store/tokenStore';

const NEON = '#14f195';
const MUTED = 'rgba(255,255,255,0.22)';
const NAV = [
  { path: '/',          label: 'TERMINAL',  icon: '⬡' },
  { path: '/market',    label: 'MARKET',    icon: '📈' },
  { path: '/ai-signal', label: 'AI SIGNAL', icon: '🤖' },
  { path: '/upgrade',   label: 'PRO',       icon: '💎' },
];

export default function GlobalNav() {
  const router   = useRouter();
  const pathname = usePathname();
  const { wsConnected, mint, token } = useTokenStore();
  const [search, setSearch] = useState('');
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const fn = () => setNarrow(window.innerWidth < 860);
    fn();
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    const q = search.trim();
    if (q.length > 20) {
      useTokenStore.getState().setMint(q);
      router.push(`/?mint=${q}`);
      setSearch('');
    }
  };

  return (
    <>
      <style>{`
        @keyframes wsPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(20,241,149,.5)}70%{opacity:.7;box-shadow:0 0 0 5px rgba(20,241,149,0)}}
        .gnav-btn{transition:all .18s ease!important}
        .gnav-btn:hover{color:#14f195!important;border-color:rgba(20,241,149,.25)!important;background:rgba(20,241,149,.04)!important}
      `}</style>
      <header style={{position:'sticky',top:0,zIndex:200,height:46,background:'rgba(3,5,7,0.96)',backdropFilter:'blur(20px)',borderBottom:'0.5px solid rgba(20,241,149,0.09)',display:'flex',alignItems:'center',padding:'0 16px',gap:10,boxShadow:'0 2px 20px rgba(0,0,0,0.4)'}}>
        <a href="/" style={{display:'flex',alignItems:'center',gap:7,textDecoration:'none',flexShrink:0}}>
          <div style={{width:13,height:13,border:'0.5px solid rgba(20,241,149,.55)',background:'rgba(20,241,149,.05)',transform:'rotate(45deg)',boxShadow:'0 0 8px rgba(20,241,149,.3)'}}/>
          {!narrow && <span style={{fontSize:11,fontWeight:700,color:NEON,fontFamily:"'Orbitron',monospace",letterSpacing:2}}>CRYPTOCHECK</span>}
        </a>
        <nav style={{display:'flex',gap:2}}>
          {NAV.map(({path,label,icon}) => {
            const active = pathname === path || (path !== '/' && pathname.startsWith(path));
            return (
              <button key={path} className="gnav-btn" onClick={()=>router.push(path)} style={{padding:narrow?'4px 8px':'4px 11px',fontFamily:"'Share Tech Mono',monospace",fontSize:9,letterSpacing:2,border:'0.5px solid',borderColor:active?'rgba(20,241,149,.4)':'rgba(255,255,255,.05)',color:active?NEON:MUTED,background:active?'rgba(20,241,149,.06)':'transparent',borderRadius:2,cursor:'pointer',boxShadow:active?'0 0 10px rgba(20,241,149,.07)':'none'}}>
                {narrow ? icon : label}
              </button>
            );
          })}
        </nav>
        <div style={{flex:1,maxWidth:320}}>
          <div style={{display:'flex',alignItems:'center',gap:6,background:'rgba(255,255,255,.02)',border:'0.5px solid rgba(20,241,149,.09)',borderRadius:4,padding:'5px 10px'}}>
            <span style={{color:'rgba(20,241,149,.3)',fontSize:13}}>⌕</span>
            <input value={search} onChange={e=>setSearch(e.target.value)} onKeyDown={handleSearch} placeholder={narrow?'Paste mint...':'Search token or paste mint address…'} style={{background:'transparent',border:'none',outline:'none',color:'rgba(255,255,255,.7)',fontFamily:"'Share Tech Mono',monospace",fontSize:10,width:'100%'}}/>
          </div>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
          <div style={{width:7,height:7,borderRadius:'50%',background:wsConnected?NEON:'#ff2244',animation:wsConnected?'wsPulse 2.2s ease infinite':'none'}}/>
          {!narrow && <span style={{fontSize:9,color:MUTED,letterSpacing:2}}>{wsConnected?'MAINNET':'OFFLINE'}</span>}
        </div>
        {mint && !narrow && (
          <div style={{display:'flex',alignItems:'center',gap:6,padding:'3px 10px',flexShrink:0,background:'rgba(20,241,149,.04)',border:'0.5px solid rgba(20,241,149,.18)',borderRadius:10}}>
            <span style={{color:NEON,fontSize:10,fontFamily:'monospace'}}>{token?.symbol??mint.slice(0,8)+'…'}</span>
            {token?.score!==undefined && <span style={{fontSize:9,color:token.score>=70?NEON:token.score>=40?'#ffd700':'#ff2244'}}>{token.score}/100</span>}
          </div>
        )}
      </header>
    </>
  );
}
