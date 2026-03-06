'use client';
import { useState, useEffect, useRef } from 'react';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Orbitron:wght@400;700;900&display=swap');
* { scrollbar-width: thin; scrollbar-color: #14f195 transparent; }
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #14f195; border-radius: 2px; box-shadow: 0 0 6px #14f195; }
@keyframes bootScan { 0% { transform:translateY(-100%); opacity:1; } 80% { transform:translateY(100vh); opacity:1; } 100% { transform:translateY(100vh); opacity:0; } }
@keyframes bootFade { 0%,70% { opacity:1; } 100% { opacity:0; pointer-events:none; } }
@keyframes radarSpin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
@keyframes radarPulse { 0%,100% { transform:scale(1); opacity:0.6; } 50% { transform:scale(1.08); opacity:1; } }
@keyframes ripple { 0% { transform:scale(0.6); opacity:0.8; } 100% { transform:scale(2.2); opacity:0; } }
@keyframes matrixFall { 0% { transform:translateY(-20px); opacity:0; } 10% { opacity:1; } 90% { opacity:1; } 100% { transform:translateY(100%); opacity:0; } }
@keyframes bentoIn { from { opacity:0; transform:translateY(16px) scale(0.97); filter:blur(4px); } to { opacity:1; transform:translateY(0) scale(1); filter:blur(0); } }
@keyframes neonBorder { 0%,100% { opacity:0.6; } 50% { opacity:1; } }
@keyframes slideInLeft { from { transform:translateX(-24px); opacity:0; } to { transform:translateX(0); opacity:1; } }
@keyframes shineSweep { from { left:-60%; } to { left:160%; } }
@keyframes textBlink { 0%,100% { opacity:1; } 50% { opacity:0; } }
.bento-in { animation: bentoIn 0.5s ease both; }
.buy-btn { position:relative; overflow:hidden; transition:all 0.2s; }
.buy-btn::after { content:''; position:absolute; top:-50%; left:-60%; width:40%; height:200%; background:linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent); transform:skewX(-15deg); }
.buy-btn:hover::after { animation: shineSweep 0.5s ease; }
.buy-btn:hover { background:rgba(20,241,149,0.2) !important; border-color:rgba(20,241,149,0.6) !important; box-shadow:0 0 16px rgba(20,241,149,0.3) !important; }
`;

export function injectCSS() {
  if (typeof document === 'undefined') return;
  if (document.getElementById('cryptocheck-css')) return;
  const s = document.createElement('style');
  s.id = 'cryptocheck-css';
  s.textContent = CSS;
  document.head.appendChild(s);
}

export function TerminalBoot({ onDone }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const bootLines = [
    '> CRYPTOCHECK NEURAL TERMINAL v2.1',
    '> Initializing quantum scanner...',
    '> Loading Solana RPC nodes... OK',
    '> Connecting to GoPlus Security... OK',
    '> Birdeye WebSocket... READY',
    '> GPT-4 inference engine... LOADED',
    '> All systems operational.',
    '> BOOT COMPLETE ██████████ 100%',
  ];
  useEffect(() => {
    injectCSS();
    let i = 0;
    const iv = setInterval(() => {
      if (i < bootLines.length) { setLines(prev => [...prev, bootLines[i]]); i++; }
      else { clearInterval(iv); setTimeout(() => { setDone(true); setTimeout(onDone, 600); }, 400); }
    }, 180);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'#000', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', fontFamily:"'Share Tech Mono',monospace", animation:done?'bootFade 0.6s ease forwards':'none', pointerEvents:done?'none':'all' }}>
      <div style={{ position:'absolute', left:0, right:0, height:2, background:'linear-gradient(90deg,transparent,#14f195,transparent)', boxShadow:'0 0 20px #14f195', animation:'bootScan 1.8s ease infinite', opacity:0.7 }} />
      <div style={{ maxWidth:500, width:'100%', padding:'0 32px' }}>
        <div style={{ color:'#14f195', fontSize:22, fontFamily:"'Orbitron',monospace", fontWeight:900, marginBottom:24, letterSpacing:4 }}>CRYPTOCHECK</div>
        {lines.map((line, i) => (
          <div key={i} style={{ color:i===lines.length-1?'#14f195':'rgba(20,241,149,0.5)', fontSize:12, marginBottom:6, letterSpacing:1, animation:'slideInLeft 0.2s ease both' }}>
            {line}{i===lines.length-1 && <span style={{ animation:'textBlink 0.8s infinite', marginLeft:4 }}>█</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function RadarScanner() {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:20, padding:'60px 0' }}>
      <div style={{ position:'relative', width:180, height:180 }}>
        {[0,1,2].map(i => <div key={i} style={{ position:'absolute', inset:0, borderRadius:'50%', border:'1px solid rgba(20,241,149,0.3)', animation:`ripple 2.4s ease-out ${i*0.8}s infinite` }} />)}
        {[0.25,0.5,0.75,1].map((scale,i) => <div key={i} style={{ position:'absolute', inset:`${(1-scale)*50}%`, borderRadius:'50%', border:`1px solid rgba(20,241,149,${0.08+i*0.04})` }} />)}
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ position:'absolute', width:'100%', height:'1px', background:'rgba(20,241,149,0.12)' }} />
          <div style={{ position:'absolute', width:'1px', height:'100%', background:'rgba(20,241,149,0.12)' }} />
        </div>
        <div style={{ position:'absolute', inset:0, borderRadius:'50%', overflow:'hidden', animation:'radarSpin 3s linear infinite' }}>
          <div style={{ position:'absolute', top:'50%', left:'50%', width:'50%', height:'50%', background:'conic-gradient(from 0deg,transparent 70%,rgba(20,241,149,0.4) 100%)', transformOrigin:'0% 100%' }} />
        </div>
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#14f195', boxShadow:'0 0 12px #14f195,0 0 30px #14f195', animation:'radarPulse 2s ease infinite' }} />
        </div>
      </div>
      <div style={{ textAlign:'center' }}>
        <div style={{ color:'rgba(20,241,149,0.8)', fontSize:11, letterSpacing:4, fontFamily:"'Share Tech Mono',monospace", marginBottom:6 }}>NEURAL SCANNER READY</div>
        <div style={{ color:'rgba(255,255,255,0.2)', fontSize:10, letterSpacing:2, fontFamily:'monospace' }}>ENTER MINT ADDRESS TO INITIALIZE ANALYSIS</div>
      </div>
    </div>
  );
}

const CHARS = '01アイウエオ∆∑∏∞≠≈カキクケコ';
function MatrixRain() {
  const cols = useRef(Array.from({length:28},(_,i) => ({
    x:`${i*3.6}%`, delay:Math.random()*1.5, duration:1.2+Math.random()*1.2,
    chars:Array.from({length:12},()=>CHARS[Math.floor(Math.random()*CHARS.length)])
  })));
  return (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', opacity:0.35, pointerEvents:'none', zIndex:0 }}>
      {cols.current.map((col,i) => (
        <div key={i} style={{ position:'absolute', left:col.x, top:0, bottom:0, display:'flex', flexDirection:'column', fontFamily:"'Share Tech Mono',monospace", fontSize:11, lineHeight:'16px', color:'#14f195', animation:`matrixFall ${col.duration}s ease ${col.delay}s infinite` }}>
          {col.chars.map((c,j) => <span key={j} style={{opacity:1-(j/col.chars.length)*0.8}}>{c}</span>)}
        </div>
      ))}
      <div style={{ position:'absolute', inset:0, zIndex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:12 }}>
        <div style={{ width:60, height:60, borderRadius:'50%', border:'2px solid #14f195', boxShadow:'0 0 20px #14f195', animation:'radarSpin 1s linear infinite', borderTopColor:'transparent' }} />
        <div style={{ color:'#14f195', fontSize:12, letterSpacing:4, fontFamily:"'Share Tech Mono',monospace" }}>ANALYZING...</div>
      </div>
    </div>
  );
}

function BentoCard({ children, delay=0, glowColor='#14f195', span=1, style={} }) {
  return (
    <div className="bento-in" style={{ gridColumn:`span ${span}`, background:'linear-gradient(135deg,rgba(7,13,15,0.9),rgba(3,5,7,0.95))', backdropFilter:'blur(12px)', border:`1px solid ${glowColor}22`, borderRadius:10, padding:'18px 20px', position:'relative', overflow:'hidden', animationDelay:`${delay}s`, boxShadow:`0 0 20px ${glowColor}11,inset 0 1px 0 ${glowColor}15`, ...style }}>
      {['top-left','top-right','bottom-left','bottom-right'].map(corner => (
        <div key={corner} style={{ position:'absolute', [corner.includes('top')?'top':'bottom']:0, [corner.includes('left')?'left':'right']:0, width:12, height:12, borderTop:corner.includes('top')?`1px solid ${glowColor}66`:'none', borderBottom:corner.includes('bottom')?`1px solid ${glowColor}66`:'none', borderLeft:corner.includes('left')?`1px solid ${glowColor}66`:'none', borderRight:corner.includes('right')?`1px solid ${glowColor}66`:'none' }} />
      ))}
      <div style={{ position:'absolute', top:0, left:'15%', right:'15%', height:1, background:`linear-gradient(90deg,transparent,${glowColor}55,transparent)`, animation:'neonBorder 2s ease infinite' }} />
      {children}
    </div>
  );
}

function BentoResults({ result, signal }) {
  if (!result || !signal) return null;
  const isSafe = result.score >= 70;
  const isDanger = result.score < 40;
  const glowColor = isSafe ? '#14f195' : isDanger ? '#ff2244' : '#ffd700';
  const decColor = {BUY:'#14f195',SELL:'#ff2244',HOLD:'#00d4ff',AVOID:'#ff6b35'}[signal.decision]||'#14f195';
  const liqStr = result.token.liquidityUSD>=1000 ? `$${(result.token.liquidityUSD/1000).toFixed(1)}K` : `$${result.token.liquidityUSD.toFixed(0)}`;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, fontFamily:"'Share Tech Mono',monospace" }}>
      <BentoCard delay={0} glowColor={decColor} span={2} style={{minHeight:140}}>
        <div style={{fontSize:9,letterSpacing:3,color:'rgba(255,255,255,0.3)',marginBottom:10}}>AI DECISION</div>
        <div style={{fontSize:48,fontWeight:900,color:decColor,lineHeight:1,fontFamily:"'Orbitron',monospace",textShadow:`0 0 20px ${decColor}`,marginBottom:10}}>{signal.decision}</div>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.4)',lineHeight:1.6,marginBottom:12}}>{signal.reason}</div>
        <div style={{display:'flex',gap:20}}>
          <div><div style={{fontSize:8,color:'rgba(255,255,255,0.25)',letterSpacing:2}}>CONFIDENCE</div><div style={{fontSize:22,fontWeight:700,color:decColor}}>{signal.confidence}%</div></div>
          <div><div style={{fontSize:8,color:'rgba(255,255,255,0.25)',letterSpacing:2}}>MAX POSITION</div><div style={{fontSize:22,fontWeight:700,color:'rgba(255,255,255,0.8)'}}>{signal.maxPosition}</div></div>
        </div>
      </BentoCard>
      <BentoCard delay={0.08} glowColor={glowColor} style={{minHeight:140}}>
        <div style={{fontSize:9,letterSpacing:3,color:'rgba(255,255,255,0.3)',marginBottom:10}}>TRUST SCORE</div>
        <div style={{position:'relative',width:80,height:80,margin:'0 auto 10px'}}>
          <svg width="80" height="80" viewBox="0 0 80 80">
            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6"/>
            <circle cx="40" cy="40" r="34" fill="none" stroke={glowColor} strokeWidth="6" strokeLinecap="round" strokeDasharray={`${2*Math.PI*34}`} strokeDashoffset={`${2*Math.PI*34*(1-result.score/100)}`} transform="rotate(-90 40 40)" style={{filter:`drop-shadow(0 0 6px ${glowColor})`,transition:'stroke-dashoffset 1s ease'}}/>
          </svg>
          <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
            <div style={{fontSize:20,fontWeight:700,color:glowColor,lineHeight:1}}>{result.score}</div>
            <div style={{fontSize:8,color:'rgba(255,255,255,0.3)',letterSpacing:1}}>{result.level}</div>
          </div>
        </div>
        <div style={{textAlign:'center',fontSize:11,color:glowColor,letterSpacing:2}}>{isSafe?'● SAFE':isDanger?'● DANGER':'⚠ CAUTION'}</div>
      </BentoCard>
      <BentoCard delay={0.12} glowColor="#00d4ff">
        <div style={{fontSize:9,letterSpacing:3,color:'rgba(255,255,255,0.3)',marginBottom:10}}>TOKEN</div>
        <div style={{fontSize:16,fontWeight:700,color:'#fff',marginBottom:2}}>{result.token.name}</div>
        <div style={{fontSize:10,color:'rgba(255,255,255,0.3)',marginBottom:14}}>{result.token.symbol} · {result.token.mint?.slice(0,10)}...</div>
        <div><div style={{fontSize:8,color:'rgba(255,255,255,0.25)',letterSpacing:2}}>TVL</div><div style={{fontSize:16,fontWeight:700,color:'#00d4ff'}}>{liqStr}</div></div>
      </BentoCard>
      {signal.entry && <BentoCard delay={0.16} glowColor="#14f195"><div style={{fontSize:9,letterSpacing:3,color:'rgba(20,241,149,0.5)',marginBottom:8}}>ENTRY</div><div style={{fontSize:10,color:'rgba(255,255,255,0.6)',lineHeight:1.7}}>{signal.entry}</div></BentoCard>}
      {signal.exit && <BentoCard delay={0.2} glowColor="#ff2244"><div style={{fontSize:9,letterSpacing:3,color:'rgba(255,34,68,0.6)',marginBottom:8}}>EXIT</div><div style={{fontSize:10,color:'rgba(255,255,255,0.6)',lineHeight:1.7}}>{signal.exit}</div></BentoCard>}
      {signal.alerts?.length > 0 && (
        <BentoCard delay={0.24} glowColor="#ff6b35" span={3}>
          <div style={{fontSize:9,letterSpacing:3,color:'rgba(255,107,53,0.7)',marginBottom:10}}>RISK ALERTS</div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))',gap:6}}>
            {signal.alerts.map((a,i) => <div key={i} style={{fontSize:10,color:'rgba(255,255,255,0.4)',padding:'6px 10px',background:'rgba(255,107,53,0.06)',border:'1px solid rgba(255,107,53,0.12)',borderRadius:4}}>· {a}</div>)}
          </div>
        </BentoCard>
      )}
      {result.flags?.length > 0 && (
        <BentoCard delay={0.28} glowColor={glowColor} span={3}>
          <div style={{fontSize:9,letterSpacing:3,color:'rgba(255,255,255,0.3)',marginBottom:10}}>SECURITY FLAGS</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {result.flags.map((f,i) => { const fc=f.level==='CRITICAL'?'#ff2244':f.level==='HIGH'?'#ff6b35':'#ffd700'; return <div key={i} style={{fontSize:10,padding:'4px 10px',background:`${fc}0d`,border:`1px solid ${fc}33`,borderRadius:4,color:fc}}>{f.level==='CRITICAL'?'✕':'⚠'} {f.title}</div>; })}
          </div>
        </BentoCard>
      )}
    </div>
  );
}

export default function NeuralScannerView({ result, signal, scanning, scanned }) {
  useEffect(() => { injectCSS(); }, []);
  return (
    <div style={{ position:'relative', minHeight:320 }}>
      {!scanning && !scanned && <RadarScanner />}
      {scanning && <div style={{ position:'relative', minHeight:280 }}><MatrixRain /></div>}
      {scanned && !scanning && result && signal && <BentoResults result={result} signal={signal} />}
    </div>
  );
}
